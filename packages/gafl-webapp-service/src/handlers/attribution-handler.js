import { UTM } from '../constants.js'
import { LICENCE_LENGTH } from '../uri.js'
/*
create a session
save the google campaign tracking data (as described under https://support.google.com/analytics/answer/1033863?hl=en) on the session
send a server redirect to a configurable endpoint (which in production will be the GOV.UK hosted landing page)
*/

/**
 * Agreed route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  const cache = request.cache()
  await cache.helpers.status.set({
    [UTM.CAMPAIGN]: request.query[UTM.CAMPAIGN],
    [UTM.MEDIUM]: request.query[UTM.MEDIUM]
  })
  return h.redirect(LICENCE_LENGTH.uri)
}
