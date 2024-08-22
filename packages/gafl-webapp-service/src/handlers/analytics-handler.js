import { ANALYTICS } from '../constants.js'
import db from 'debug'
const debug = db('webapp:analytics-handler')

/**
 * Analytics route handler
 * @param request
 * @param h
 * @returns {Promise}
 */

export const trackGTM = async request => {
  const pageOmit = await pageOmitted(request)
  const canTrack = await trackAnalyticsAccepted(request, pageOmit)
  const optDebug = process.env.ENABLE_ANALYTICS_OPT_IN_DEBUGGING?.toLowerCase() === 'true'
  const gtmContainerId = process.env.GTM_CONTAINER_ID
  if (optDebug && gtmContainerId) {
    if (canTrack === true) {
      debug('Session is being tracked')
    } else if (pageOmit === true) {
      debug('Session is not being tracked for current page')
    } else {
      debug('Session is not being tracked')
    }
  }
  return canTrack
}

export const trackAnalyticsAccepted = async (request, pageSkip) => {
  try {
    const analytics = await request.cache().helpers.analytics.get()
    if (analytics[ANALYTICS.acceptTracking] === true && pageSkip !== true) {
      return true
    }
  } catch {}

  return false
}

export const pageOmitted = async request => {
  try {
    const analytics = await request.cache().helpers.analytics.get()
    if (analytics[ANALYTICS.omitPageFromAnalytics] === true) {
      return true
    }
  } catch {}

  return false
}

export default async (request, h) => {
  const { payload } = request
  const analytics = await request.cache().helpers.analytics.get()

  if (analytics[ANALYTICS.selected] === true) {
    await request.cache().helpers.analytics.set({
      [ANALYTICS.seenMessage]: true
    })
  } else if (payload.analyticsResponse === 'accept') {
    await request.cache().helpers.analytics.set({
      [ANALYTICS.selected]: true,
      [ANALYTICS.acceptTracking]: true
    })
  } else if (payload.analyticsResponse === 'reject') {
    await request.cache().helpers.analytics.set({
      [ANALYTICS.selected]: true,
      [ANALYTICS.acceptTracking]: false
    })
  }

  const {
    url: { host },
    headers: { origin, referer }
  } = request
  const referrerHost = new URL(referer).host

  if (host === referrerHost) {
    const redirect = referer.replace(origin, '')
    return h.redirectWithLanguageCode(redirect)
  }

  return h.redirectWithLanguageCode('/buy')
}

export const checkAnalyticsCookiesPage = async request => {
  const { payload } = request

  if (payload?.analyticsResponse) {
    if (payload.analyticsResponse === 'accept') {
      await request.cache().helpers.analytics.set({
        [ANALYTICS.selected]: true,
        [ANALYTICS.acceptTracking]: true,
        [ANALYTICS.seenMessage]: true
      })
    } else if (payload.analyticsResponse === 'reject') {
      await request.cache().helpers.analytics.set({
        [ANALYTICS.selected]: true,
        [ANALYTICS.acceptTracking]: false,
        [ANALYTICS.seenMessage]: true
      })
    }
  }
}
