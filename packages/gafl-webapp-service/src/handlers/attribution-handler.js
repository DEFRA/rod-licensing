import { ATTRIBUTION_REDIRECT_DEFAULT, UTM, QUERYSTRING_LICENCE_KEY, RENEWALS_CAMPAIGN_ID } from '../constants.js'
import { initialiseAnalyticsSessionData } from '../processors/analytics.js'
import { IDENTIFY, RENEWAL_BASE } from '../uri.js'

/**
 * Attribution route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  await initialiseAnalyticsSessionData(request)

  if (request.query[UTM.CAMPAIGN] === RENEWALS_CAMPAIGN_ID) {
    if (request.query[QUERYSTRING_LICENCE_KEY]) {
      return h.redirectWithLanguageCode(`${RENEWAL_BASE.uri}/${request.query[QUERYSTRING_LICENCE_KEY]}`)
    }
    return h.redirectWithLanguageCode(IDENTIFY.uri)
  }

  return h.redirectWithLanguageCode(process.env.ATTRIBUTION_REDIRECT || ATTRIBUTION_REDIRECT_DEFAULT)
}
