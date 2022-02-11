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
  console.log('attribution handler')
  await initialiseAnalyticsSessionData(request)

  if (request.query[UTM.CAMPAIGN] === RENEWALS_CAMPAIGN_ID) {
    console.log('renewals campaign')
    if (request.query[QUERYSTRING_LICENCE_KEY]) {
      const url = `${RENEWAL_BASE.uri}/${request.query[QUERYSTRING_LICENCE_KEY]}`
      console.log(`found licence key, redirecting ${url}`)
      return h.redirect(url)
    }
    console.log('no licence key, redirecting to identify')
    return h.redirect(IDENTIFY.uri)
  }

  console.log('redirecting to websales')
  return h.redirect(process.env.ATTRIBUTION_REDIRECT || ATTRIBUTION_REDIRECT_DEFAULT)
}
