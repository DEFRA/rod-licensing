import { ANALYTICS } from '../constants.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'
/**
 * Analytics route handler
 * @param request
 * @param h
 * @returns {Promise}
 */

export const checkAnalytics = async request => {
  try {
    const analytics = await request.cache().helpers.analytics.get()
    if (analytics && analytics[ANALYTICS.acceptTracking] === true) {
      return true
    }
  } catch {}

  return false
}

export const getAnalyticsSessionId = async request => {
  try {
    return request.cache().getId()
  } catch {}

  return null
}

export default async (request, h) => {
  const payload = request.payload
  const analytics = await request.cache().helpers.analytics.get()

  if (analytics[ANALYTICS.selected] !== true) {
    if (payload.analyticsResponse === 'accept') {
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
  } else if (analytics[ANALYTICS.selected] === true) {
    await request.cache().helpers.analytics.set({
      [ANALYTICS.seenMessage]: true
    })
  }

  // https://localhost:3043/buy/name
  const origin = request.headers.origin
  const referer = request.headers.referer
  const redirect = referer.replace(origin, '')
  console.log('referrer:', redirect)

  return h.redirect(addLanguageCodeToUri(request, redirect))
}
