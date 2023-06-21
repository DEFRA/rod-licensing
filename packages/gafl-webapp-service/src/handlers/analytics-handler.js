import { ANALYTICS } from '../constants.js'
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
      const pageSkip = await skipPage(request)
      if (pageSkip) {
        return false
      }
      return true
    }
  } catch {}

  return false
}

export const skipPage = async request => {
  console.log('hit 2')
  const analytics = await request.cache().helpers.analytics.get()
  if (analytics[ANALYTICS.seenMessage] === true && analytics[ANALYTICS.skipPage] === undefined) {
    return true
  }
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
