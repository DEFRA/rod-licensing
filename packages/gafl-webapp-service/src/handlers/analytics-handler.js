import { ANALYTICS } from '../constants.js'
/**
 * Analytics route handler
 * @param request
 * @param h
 * @returns {Promise}
 */

export default async (request, h) => {
  console.log('request.payload', request.payload)
  // const payload = request.payload
  const analytics = await request.cache().helpers.analytics.get()

  // if (status.analyticsSelected !== true) {
  //   status.acceptedTracking = payload.analyticsResponse
  //   status.analyticsSelected = true
  // } else if (status.analyticsSelected === true) {
  //   status.analyticsMessageDisplay = payload.hideMessage
  // }

  // analytics.analyticsSelected = true

  analytics[ANALYTICS.selected] = true

  await request.cache().helpers.analytics.set({ [ANALYTICS.selected]: true })

  const newAnalytics = await request.cache().helpers.analytics.get()
  console.log('analytics:', analytics.selected)
  console.log('new analytics:', newAnalytics.selected)

  return h.redirect('/buy')
}

export const checkAnalytics = async (request) => {
  const status = await request.cache().helpers.status.get()

  if (status.acceptedTracking === true) {
    return true
  }

  return false
}
