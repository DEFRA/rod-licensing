import { UTM, ATTRIBUTION_REDIRECT_DEFAULT } from '../constants.js'

const sanitiseInput = value => value ? encodeURIComponent(value) : value

/**
 * Attribution route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  const redirectTarget = process.env.ATTRIBUTION_REDIRECT || ATTRIBUTION_REDIRECT_DEFAULT
  const cache = request.cache()
  await cache.helpers.status.set({
    attribution: {
      [UTM.CAMPAIGN]: sanitiseInput(request.query[UTM.CAMPAIGN]),
      [UTM.MEDIUM]: sanitiseInput(request.query[UTM.MEDIUM]),
      [UTM.CONTENT]: sanitiseInput(request.query[UTM.CONTENT]),
      [UTM.SOURCE]: sanitiseInput(request.query[UTM.SOURCE]),
      [UTM.TERM]: sanitiseInput(request.query[UTM.TERM])
    }
  })
  return h.redirect(redirectTarget)
}
