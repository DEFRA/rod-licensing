'use strict'

<<<<<<< HEAD
import uuidv4 from 'uuid/v4.js'
=======
import uuid from 'uuid'
>>>>>>> Added session and cache mechanism
import db from 'debug'
import moment from 'moment'

const debug = db('session-manager')
/**
 * (1) If the user cache does not exist create it
 * (2) If the cookie does not exist create it
 * @param sessionCookieName
<<<<<<< HEAD
 * @returns {function(*, *)}
 */
const sessionManager = sessionCookieName => async (request, h) => {
  // If the session cookie does not exist create it
  if (!request.state[sessionCookieName]) {
    const id = uuidv4()
    debug(`New session cookie: ${id}`)
=======
 * @returns {function(*, *): string|((key?: IDBValidKey) => void)}
 */
const sessionManager = (sessionCookieName) => async (request, h) => {
  // If the session cookie does not exist create it
  if (!request.state[sessionCookieName]) {
    const id = uuid.v4()
    console.debug(`New session cookie: ${id}`)
>>>>>>> Added session and cache mechanism
    h.state(sessionCookieName, { id })
    request.state[sessionCookieName] = { id }
  }

<<<<<<< HEAD
  if (!(await request.cache().get())) {
    await request.cache().set({ created: moment.utc() })
=======
  if (!await request.cache().get()) {
    request.cache().set({ created: moment.utc() })
>>>>>>> Added session and cache mechanism
  }

  return h.continue
}

export default sessionManager
