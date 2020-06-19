import { CacheError } from '../session-cache/cache-manager.js'
import { PAGE_STATE } from '../constants.js'
import { CONTROLLER } from '../uri.js'
import GetDataRedirect from './get-data-redirect.js'

/**
 * Flattens the error structure from joi for use in the templates
 * @param e
 * @returns {{}}
 */
export const errorShimm = e => e.details.reduce((a, c) => ({ ...a, [c.path[0]]: c.type }), {})

/**
 * Calculate the back reference. It is
 * (1) Null if no page has completed
 * (2) The page before the current page if this page has been completed before
 * (3) The last page completed if this page has not been completed
 * @param request
 * @param path
 * @param pageData
 * @returns {Promise<void>}
 */
const getBackReference = async (request, path) => {
  let result = null
  const status = await request.cache().helpers.status.getCurrentPermission()
  if (status.pageStack) {
    const psIdx = status.pageStack.findIndex(s => path === s)
    if (psIdx === -1) {
      result = status.pageStack[status.pageStack.length - 1]
    } else {
      result = status.pageStack[psIdx - 1]
    }
  }

  return result
}

/**
 * @param path - the path attached to the handler
 * @param view - the name of the view template
 * @param completion - redirect to on successful completion
 * @param getData - This function is used to preload the page with any data required to populate
 * @returns {{post: (function(*, *): ResponseObject | * | Response), get: (function(*, *): *), error: (function(*, *, *=): ResponseObject)}}
 */
export default (path, view, completion, getData) => ({
  /**
   * Generic get handler for pages
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  get: async (request, h) => {
    const page = await request.cache().helpers.page.getCurrentPermission(view)
    const pageData = page || {}

    // The page data payload may be enriched by the data fetched by getData
    if (getData && typeof getData === 'function') {
      try {
        const data = await getData(request)
        Object.assign(pageData, { data })
      } catch (err) {
        // If GetDataRedirect is thrown the getData function is requesting a redirect
        if (err instanceof GetDataRedirect) {
          return h.redirect(err.redirectUrl)
        }

        throw err
      }
    }

    // Calculate the back reference and add to page
    pageData.backRef = await getBackReference(request, path)
    return h.view(view, pageData)
  },
  /**
   * Generic post handler for pages
   * @param request
   * @param h
   * @returns {Promise<*|Response>}
   */
  post: async (request, h) => {
    await request.cache().helpers.page.setCurrentPermission(view, { payload: request.payload })
    const status = await request.cache().helpers.status.getCurrentPermission()
    status.pageStack = status.pageStack || []
    if (!status.pageStack.find(s => path === s)) {
      status.pageStack.push(request.path)
    }
    status.currentPage = view
    status[view] = PAGE_STATE.completed
    await request.cache().helpers.status.setCurrentPermission(status)
    return h.redirect(completion)
  },
  /**
   * Generic error handler for pages
   * @param request
   * @param h
   * @param err
   * @returns {Promise}
   */
  error: async (request, h, err) => {
    try {
      await request.cache().helpers.page.setCurrentPermission(view, { payload: request.payload, error: errorShimm(err) })
      await request.cache().helpers.status.setCurrentPermission({ [view]: PAGE_STATE.error, currentPage: view })
      return h.redirect(request.path).takeover()
    } catch (err2) {
      // Need a catch here if the user has posted an invalid response with no cookie
      if (err2 instanceof CacheError) {
        return h.redirect(CONTROLLER.uri).takeover()
      }

      throw err2
    }
  }
})
