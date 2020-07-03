import { UTM } from '../constants.js'
import { LICENCE_LENGTH } from '../uri.js'

/**
 * Agreed route handler
 * @param request
 * @param h
 * @returns {Promise}
 */
export default async (request, h) => {
  const cache = request.cache()
  await cache.helpers.status.set({
    attribution: {
      [UTM.CAMPAIGN]: request.query[UTM.CAMPAIGN],
      [UTM.MEDIUM]: request.query[UTM.MEDIUM],
      [UTM.CONTENT]: request.query[UTM.CONTENT],
      [UTM.SOURCE]: request.query[UTM.SOURCE],
      [UTM.TERM]: request.query[UTM.TERM]
    }
  })
  return h.redirect(LICENCE_LENGTH.uri)
}
