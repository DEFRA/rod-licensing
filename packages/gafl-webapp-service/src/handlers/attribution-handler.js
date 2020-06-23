import { UTM } from '../constants'
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
export default (request, h) => {
  const cache = request.cache()
  const status = cache.helpers.status.get()
  cache.helpers.status.set({
    ...status,
    [UTM.CAMPAIGN]: request.query[UTM.CAMPAIGN],
    [UTM.MEDIUM]: request.query[UTM.MEDIUM]
  })
  h.redirect(process.env.ATTRIBUTION_REDIRECT)
}
