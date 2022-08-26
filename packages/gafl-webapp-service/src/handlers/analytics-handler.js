import { ANALYTICS } from '../constants.js'
/**
 * Analytics route handler
 * @param request
 * @param h
 * @returns {Promise}
 */

// export const checkAnalytics = async request => {
//   if (request.cache().hasSession()) {
//     const analytics = await request.cache().helpers.analytics.get()
//     if (analytics && analytics[ANALYTICS.acceptTracking] === true) {
//       return true
//     }
//   }

//   return false
// }

export const checkAnalytics = async request => {
  try {
    const analytics = await request.cache().helpers.analytics.get()
    if (analytics && analytics[ANALYTICS.acceptTracking] === true) {
      return true
    }
  } catch {}

  return false
}

// export const getAnalyticsSessionId = async request => {
//   if (request.cache().hasSession()) {
//     const sessionId = await request.cache().getId()
//     return sessionId
//   }

//   return null
// }

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

  return h.redirect('/buy')
}
