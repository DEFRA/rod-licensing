import { UTM, ATTRIBUTION_REDIRECT_DEFAULT } from '../constants.js'

const sanitiseInput = value => value ? encodeURIComponent(value) : value

/**
 * Agreed route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  const redirectTarget = process.env.ATTRIBUTION_REDIRECT || ATTRIBUTION_REDIRECT_DEFAULT
  const cache = request.cache()
  const campaign = sanitiseInput(request.query[UTM.CAMPAIGN])
  const medium = sanitiseInput(request.query[UTM.MEDIUM])
  const content = sanitiseInput(request.query[UTM.CONTENT])
  const source = sanitiseInput(request.query[UTM.SOURCE])
  const term = sanitiseInput(request.query[UTM.TERM])
  await cache.helpers.status.set({
    attribution: {
      [UTM.CAMPAIGN]: campaign,
      [UTM.MEDIUM]: medium,
      [UTM.CONTENT]: content,
      [UTM.SOURCE]: source,
      [UTM.TERM]: term
    }
  })
  return h.redirect(redirectTarget)
}
