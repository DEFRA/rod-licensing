import { UTM, ATTRIBUTION_REDIRECT_DEFAULT } from '../constants.js'

/**
 * Attribution route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  const redirectTarget = process.env.ATTRIBUTION_REDIRECT || ATTRIBUTION_REDIRECT_DEFAULT
  const cache = request.cache()
  if (!(request.query[UTM.CAMPAIGN] && request.query[UTM.SOURCE])) {
    console.warn('Campaign and source values should be set in attribution')
  }
  await cache.helpers.status.set({
    attribution: {
      [UTM.CAMPAIGN]: request.query[UTM.CAMPAIGN],
      [UTM.MEDIUM]: request.query[UTM.MEDIUM],
      [UTM.CONTENT]: request.query[UTM.CONTENT],
      [UTM.SOURCE]: request.query[UTM.SOURCE],
      [UTM.TERM]: request.query[UTM.TERM]
    }
  })
  return h.redirect(redirectTarget)
}
