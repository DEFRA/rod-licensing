'use strict'

import uuidv4 from 'uuid/v4.js'
import db from 'debug'

/**
 * If there is no session cookie create it and initialize user cache contexts
 * on the key stored in the cookie
 * @param sessionCookieName
 * @returns {function(*, *)}
 */
const debug = db('session-manager')

const sessionManager = sessionCookieName => async (request, h) => {
  if (request.path.startsWith('/buy') && !request.state[sessionCookieName]) {
    const id = uuidv4()
    debug(`New session cookie: ${id}`)
    h.state(sessionCookieName, { id })
    request.state[sessionCookieName] = { id }

    // Initialize cache contexts
    await request.cache().initialize()
  }

  return h.continue
}

export default sessionManager
