import { CacheError } from '../lib/cache-manager.js'
import { CONTROLLER, PAGE_STATE } from '../constants.js'
import GetDataRedirect from './get-data-redirect.js'
const errorShimm = e => e.details.reduce((a, c) => ({ ...a, [c.path[0]]: c.type }), {})

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
    await request.cache().helpers.status.setCurrentPermission({ [view]: PAGE_STATE.completed })
    await request.cache().helpers.status.setCurrentPermission({ currentPage: view })
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
      await request.cache().helpers.status.setCurrentPermission({ [view]: PAGE_STATE.error })
      await request.cache().helpers.status.setCurrentPermission({ currentPage: view })
      return h.redirect(path).takeover()
    } catch (err2) {
      // Need a catch here if the user has posted an invalid response with no cookie
      if (err2 instanceof CacheError) {
        return h.redirect(CONTROLLER.uri).takeover()
      }

      throw err2
    }
  }
})
