import { ANALYTICS } from '../constants.js'
/**
 * Analytics route handler
 * @param request
 * @param h
 * @returns {Promise}
 */

export const checkAnalytics = async (request, pageSkip) => {
  try {
    const analytics = await request.cache().helpers.analytics.get()
    if (analytics[ANALYTICS.acceptTracking] === true) {
      if (pageSkip === true) {
        return false
      }
      return true
    }
  } catch {}

  return false
}

export const checkPage = async request => {
  try {
    const analytics = await request.cache().helpers.analytics.get()
    if (analytics[ANALYTICS.skipPage] === true) {
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
