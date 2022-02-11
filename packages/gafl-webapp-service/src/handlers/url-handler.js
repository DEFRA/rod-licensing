import { QUERYSTRING_LICENCE_KEY } from '../constants.js'
import { initialiseAnalyticsSessionData } from '../processors/analytics.js'
import { IDENTIFY, RENEWAL_LICENCE } from '../uri.js'

/**
 * Attribution route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  await initialiseAnalyticsSessionData(request)
  if (request.query[QUERYSTRING_LICENCE_KEY]) {
    const refNumber = request.query[QUERYSTRING_LICENCE_KEY]
    const sixDigit = /[A-Za-z0-9]{6}/.test(refNumber)
    if (!sixDigit) {
      return h.redirect(IDENTIFY)
    }
    return h.redirect(`${RENEWAL_LICENCE}/${refNumber}`)
  }
  return h.redirect(IDENTIFY)
}
