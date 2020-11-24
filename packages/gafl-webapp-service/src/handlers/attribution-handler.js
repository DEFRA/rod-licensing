import { ATTRIBUTION_REDIRECT_DEFAULT } from '../constants.js'
import { initialiseAnalyticsSessionData } from '../processors/analytics.js'

/**
 * Attribution route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  await initialiseAnalyticsSessionData(request)
  return h.redirect(process.env.ATTRIBUTION_REDIRECT || ATTRIBUTION_REDIRECT_DEFAULT)
}
