import db from 'debug'
import { CacheError } from '../session-cache/cache-manager.js'
import { PAGE_STATE, ANALYTICS } from '../constants.js'
import {
  AGREED,
  CONTROLLER,
  LICENCE_DETAILS,
  LICENCE_FOR,
  ORDER_COMPLETE,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED,
  PROCESS_ANALYTICS_PREFERENCES,
  IDENTIFY
} from '../uri.js'
import GetDataRedirect from './get-data-redirect.js'
import journeyDefinition from '../routes/journey-definition.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'

const debug = db('webapp:page-handler')
const pagesToOmitAnalyticsBanner = [AGREED.uri, LICENCE_DETAILS.uri, ORDER_COMPLETE.uri, PAYMENT_CANCELLED.uri, PAYMENT_FAILED.uri]
const pagesJourneyBeginning = [LICENCE_FOR.uri, IDENTIFY.uri]

const displayAnalytics = request => {
  if (pagesToOmitAnalyticsBanner.includes(request.path)) {
    return false
  }
  return request.path.startsWith('/buy')
}

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
  const current = journeyDefinition.find(p => p.current.page === view)
  if (!current || !current.backLink) {
    return null
  }

  if (typeof current.backLink === 'function') {
    const backLink = current.backLink(
      await request.cache().helpers.status.getCurrentPermission(),
      await request.cache().helpers.transaction.getCurrentPermission()
    )
    return backLink ? addLanguageCodeToUri(request, backLink) : null
  } else {
    return addLanguageCodeToUri(request, current.backLink)
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
    let page
    // try catch to find out what is causing "Cannot read property 'view' of undefined"
    try {
      page = await request.cache().helpers.page.getCurrentPermission(view)
    } catch (err) {
      const pageCache = await request.cache().helpers.page.get()
      debug(`Page cache - ${JSON.stringify(pageCache)}`)

      const statusCache = await request.cache().helpers.status.get()
      debug(`Status cache - ${JSON.stringify(statusCache)}`)

      const transactionCache = await request.cache().helpers.transaction.get()
      debug(`Transaction cache - ${JSON.stringify(transactionCache)}`)

      const analyticsCache = await request.cache().helpers.analytics.get()
      debug(`Analytics cache - ${JSON.stringify(analyticsCache)}`)

      throw err
    }

    const pageData = page || {}

    // The page data payload may be enriched by the data fetched by getData
    if (getData && typeof getData === 'function') {
      try {
        const data = await getData(request)
        Object.assign(pageData, { data })
      } catch (err) {
        // If GetDataRedirect is thrown the getData function is requesting a redirect
        if (err instanceof GetDataRedirect) {
          return h.redirectWithLanguageCode(request, err.redirectUrl)
        }

        throw err
      }
    }

    // It is necessary then using the back buttons and other indirect navigations to clear any errors
    // from abandoned pages
    await clearErrorsFromOtherPages(request, view)

    // Calculate the back reference and add to page
    pageData.mssgs = request.i18n.getCatalog()
    pageData.altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
    pageData.backRef = await getBackReference(request, view)
    pageData.uri = { ...(pageData.uri || {}), analyticsFormAction: addLanguageCodeToUri(request, PROCESS_ANALYTICS_PREFERENCES.uri) }

    const analytics = await request.cache().helpers.analytics.get()
    pageData.analyticsMessageDisplayed = analytics ? analytics[ANALYTICS.seenMessage] : false
    pageData.analyticsSelected = analytics ? analytics[ANALYTICS.selected] : false
    pageData.acceptedTracking = analytics ? analytics[ANALYTICS.acceptTracking] : false

    pageData.displayAnalytics = displayAnalytics(request)

    if (pagesJourneyBeginning.includes(request.path)) {
      pageData.journeyBeginning = true
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
    const status = await request.cache().helpers.status.getCurrentPermission()
    status.currentPage = view
    status[view] = PAGE_STATE.completed
    await request.cache().helpers.status.setCurrentPermission(status)

    if (typeof completion === 'function') {
      return h.redirectWithLanguageCode(request, await completion(request))
    } else {
      return h.redirectWithLanguageCode(request, completion)
    }
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

      return h.redirectWithLanguageCode(request).takeover()
    } catch (err2) {
      // Need a catch here if the user has posted an invalid response with no cookie
      if (err2 instanceof CacheError) {
        return h.redirectWithLanguageCode(request, CONTROLLER.uri).takeover()
      }

      throw err2
    }
  }
})
