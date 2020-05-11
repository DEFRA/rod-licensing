import { v4 as uuidv4 } from 'uuid'
import db from 'debug'
import addPermission from './add-permission.js'
import {
  CONTROLLER,
  AGREED,
  NEW_TRANSACTION,
  ORDER_COMPLETE,
  PAYMENT_FAILED,
  PAYMENT_CANCELLED,
  TEST_TRANSACTION,
  TEST_STATUS
} from '../uri.js'

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
    } else {
      // This keeps the cookie alive
      const { id } = request.state[sessionCookieName]
      h.state(sessionCookieName, { id })
    }
    /*
     * Once the agreed flag is set then any request to the service is redirected to the agreed handler
     * except for the set in the array which includes the order-complete and new transaction pages and the agreed handler itself.
     */
    const status = await request.cache().helpers.status.get()
    if (
      status.agreed &&
      ![
        NEW_TRANSACTION.uri,
        CONTROLLER.uri,
        AGREED.uri,
        ORDER_COMPLETE.uri,
        PAYMENT_FAILED.uri,
        PAYMENT_CANCELLED.uri,
        TEST_TRANSACTION.uri,
        TEST_STATUS.uri
      ].includes(request.path)
    ) {
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
