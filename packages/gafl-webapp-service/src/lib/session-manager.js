'use strict'

import uuid from 'uuid'
import db from 'debug'
import moment from 'moment'

const debug = db('session-manager')
/**
 * (1) If the user cache does not exist create it
 * (2) If the cookie does not exist create it
 * @param sessionCookieName
 * @returns {function(*, *): string|((key?: IDBValidKey) => void)}
 */
const sessionManager = (sessionCookieName) => async (request, h) => {
  // If the session cookie does not exist create it
  if (!request.state[sessionCookieName]) {
    const id = uuid.v4()
    console.debug(`New session cookie: ${id}`)
    h.state(sessionCookieName, { id })
    request.state[sessionCookieName] = { id }
  }

  if (!await request.cache().get()) {
    request.cache().set({ created: moment.utc() })
  }

  return h.continue
}

export default sessionManager
