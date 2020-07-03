import { CacheError } from '../session-cache/cache-manager.js'
import { PAGE_STATE } from '../constants.js'
import { CONTROLLER, CONTACT_SUMMARY, LICENCE_SUMMARY, TERMS_AND_CONDITIONS } from '../uri.js'
import GetDataRedirect from './get-data-redirect.js'

const getTrackingProductDetailsFromTransaction = transaction =>
  transaction.permissions.map(permission => ({
    id: permission.permit.description,
    name: `${permission.permit.permitSubtype.label} - ${permission.permit.numberOfRods} rod(s) licence`,
    brand: permission.permit.permitType.label,
    category: [
      permission.permit.permitSubtype.label,
      `${permission.permit.numberOfRods} rod(s)`,
      permission.permit.concessions.length ? permission.permit.concessions.join(',') : 'Full'
    ].join('/'),
    variant: `${permission.permit.durationMagnitude} ${permission.permit.durationDesignator.label}`,
    quantity: 1,
    price: permission.permit.cost
  }))

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
const getBackReference = async (request) => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  status.backRef = status.backRef || { current: null }
  status.backRef.previous = status.backRef.current
  status.backRef.current = request.path
  await request.cache().helpers.status.setCurrentPermission(status)
  return status.backRef.previous
}

const performTracking = async (request, path) => {
  if ([CONTACT_SUMMARY.uri, LICENCE_SUMMARY.uri].includes(path)) {
    const transaction = await request.cache().helpers.transaction.get()
    request.ga.ecommerce().detail(
      getTrackingProductDetailsFromTransaction(transaction)
    )
  }
  if (path === TERMS_AND_CONDITIONS.uri) {
    const transaction = await request.cache().helpers.transaction.get()
    request.ga.ecommerce().add(
      getTrackingProductDetailsFromTransaction(transaction)
    )
  }
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

    performTracking(request, path)

    // Calculate the back reference and add to page
    pageData.backRef = await getBackReference(request)
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
