import { ATTRIBUTION_REDIRECT_DEFAULT, UTM, QUERYSTRING_LICENCE_KEY } from '../constants.js'
import { initialiseAnalyticsSessionData } from '../processors/analytics.js'
import { RENEWAL_BASE } from '../uri.js'

/**
 * Attribution route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  await initialiseAnalyticsSessionData(request)

  if (request.query[UTM.CAMPAIGN] === 'renewals') {
    if (request.query[QUERYSTRING_LICENCE_KEY]) {
      return h.redirect(`${RENEWAL_BASE}/${request.query[QUERYSTRING_LICENCE_KEY]}`)
    }
    return h.redirect(`${RENEWAL_BASE}`)
  }
  return h.redirect(process.env.ATTRIBUTION_REDIRECT || ATTRIBUTION_REDIRECT_DEFAULT)
}
