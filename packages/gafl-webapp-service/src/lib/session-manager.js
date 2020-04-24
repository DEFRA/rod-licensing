import uuidv4 from 'uuid/v4.js'
import db from 'debug'
import addPermission from './add-permission.js'
import { AGREED } from '../constants.js'

/**
 * If there is no session cookie create it and initialize user cache contexts
 * on the key stored in the cookie
 * @param sessionCookieName
 * @returns {function(*, *)}
 */
const debug = db('webapp:session-manager')

const sessionManager = sessionCookieName => async (request, h) => {
  if (request.path.startsWith('/buy')) {
    if (!request.state[sessionCookieName]) {
      const id = uuidv4()
      debug(`New session cookie: ${id}`)
      h.state(sessionCookieName, { id })
      request.state[sessionCookieName] = { id }

      // Initialize cache contexts
      await request.cache().initialize()
    } else if (!(await request.cache().helpers.status.get())) {
      // A. The redis cache has expired - or been removed. Reinitialize a new cache
      await request.cache().initialize()
    }

    const status = await request.cache().helpers.status.get()
    if (status.agreed && request.path !== AGREED.uri) {
      return h.redirect(AGREED.uri).takeover()
    }

    // There is no permission initialized
    if (!(await request.cache().helpers.transaction.hasPermission(request))) {
      await addPermission(request)
    }
  }

  return h.continue
}

export default sessionManager
