import { CacheError } from '../session-cache/cache-manager.js'
import { PAGE_STATE } from '../constants.js'
import { CONTROLLER } from '../uri.js'
import GetDataRedirect from './get-data-redirect.js'
import journeyDefinition from '../routes/journey-definition.js'

/**
 * Flattens the error structure from joi for use in the templates
 * @param e
 * @returns {{}}
 */
export const errorShimm = e => e.details.reduce((a, c) => ({ ...a, [c.path[0]]: c.type }), {})

/**
 * Keeps a previous and current pages
 * @param request
 * @param path
 * @param pageData
 * @returns {Promise<void>}
 */
const getBackReference = async (request, view) => {
  const current = journeyDefinition.find(p => p.currentPage === view)

  if (!current || !current.backLink) {
    return null
  }

  if (typeof current.backLink === 'function') {
    return current.backLink(
      await request.cache().helpers.status.getCurrentPermission(),
      await request.cache().helpers.transaction.getCurrentPermission()
    )
  } else {
    return current.backLink
  }
}

const clearErrorsFromOtherPages = async (request, view) => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const pagesWithError = Object.entries(status)
    .filter(entry => entry[0] !== 'currentPage' && entry[0] !== view && entry[1] === PAGE_STATE.error)
    .map(entry => entry[0])

  await Promise.all(pagesWithError.map(async p => request.cache().helpers.page.setCurrentPermission(p, {})))
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

    // It is necessary then using the back buttons and other indirect navigations to clear any errors
    // from abandoned pages
    await clearErrorsFromOtherPages(request, view)

    // Calculate the back reference and add to page
    pageData.backRef = await getBackReference(request, view)
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
