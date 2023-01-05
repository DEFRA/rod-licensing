import { QUERYSTRING_LICENCE_KEY, UTM, RENEWALS_CAMPAIGN_ID, AEN_INVITATION_ID } from '../constants.js'
import { initialiseAnalyticsSessionData } from '../processors/analytics.js'
import { IDENTIFY, ATTRIBUTION } from '../uri.js'

/**
 * Attribution route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  await initialiseAnalyticsSessionData(request)
  if (request.params[QUERYSTRING_LICENCE_KEY]) {
    const refNumber = request.params[QUERYSTRING_LICENCE_KEY]
    const sixDigit = /^[A-Za-z0-9]{6}$/.test(refNumber)
    if (sixDigit) {
      return h.redirectWithLanguageCode(
        `${ATTRIBUTION.uri}?${UTM.CAMPAIGN}=${RENEWALS_CAMPAIGN_ID}&${UTM.SOURCE}=${AEN_INVITATION_ID}&${QUERYSTRING_LICENCE_KEY}=${refNumber}`
      )
    }
  }
  return h.redirectWithLanguageCode(IDENTIFY.uri)
}
