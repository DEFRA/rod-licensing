import { v4 as uuidv4 } from 'uuid'
import db from 'debug'
import addPermission from './add-permission.js'

import {
  CONTROLLER,
  AGREED,
  NEW_TRANSACTION,
  ORDER_COMPLETE,
  ORDER_COMPLETE_PDF,
  PAYMENT_FAILED,
  PAYMENT_CANCELLED,
  TEST_TRANSACTION,
  TEST_STATUS
} from '../uri.js'

const debug = db('webapp:session-manager')

const protectionExemptSet = [
  NEW_TRANSACTION.uri,
  CONTROLLER.uri,
  AGREED.uri,
  ORDER_COMPLETE.uri,
  ORDER_COMPLETE_PDF.uri,
  PAYMENT_FAILED.uri,
  PAYMENT_CANCELLED.uri,
  TEST_TRANSACTION.uri,
  TEST_STATUS.uri
]

const forbiddenUnlessAgreedSet = [ORDER_COMPLETE.uri, ORDER_COMPLETE_PDF.uri, PAYMENT_FAILED.uri, PAYMENT_CANCELLED.uri]

export const useSessionCookie = request => request.path.startsWith('/buy')

/**
 * If there is no session cookie create it and initialize user cache contexts
 * on the key stored in the cookie.
 * Handles the routing logic if the agreed status is set i.e. the transaction is locked
 * @param sessionCookieName
 * @returns {function(*, *)}
 */
const sessionManager = sessionCookieName => async (request, h) => {
  if (useSessionCookie(request)) {
    let initialized = false

    if (!request.state[sessionCookieName]) {
      /*
       * No cookie - create and initialize cache
       */
      const id = uuidv4()
      debug(`New session cookie: ${id}`)
      h.state(sessionCookieName, { id })
      request.state[sessionCookieName] = { id }
      await request.cache().initialize()
      initialized = true
    } else if (!(await request.cache().helpers.status.get())) {
      /*
       * The redis cache has expired - or been removed. Reinitialize a new cache
       */
      await request.cache().initialize()
      initialized = true
    } else {
      /*
       * Keep the cookie alive so that is persists as long as the cache -
       * the cache has the TTL reset on each write
       */
      const { id } = request.state[sessionCookieName]
      h.state(sessionCookieName, { id })
    }

    /*
     * Once the agreed flag is set then any request to the service is redirected to the agreed handler
     * except for the set in the array which includes the order-complete and new transaction pages and the agreed handler itself.
     */
    const status = await request.cache().helpers.status.get()
    if (status.agreed && !protectionExemptSet.includes(request.path)) {
      return h.redirect(AGREED.uri).takeover()
    }

    /*
     * If no permission has been initialized, then create one.
     */
    if (!(await request.cache().helpers.transaction.hasPermission(request))) {
      await addPermission(request)
    }

    /*
     * If we have a new cookie/cache - covering the cases where the cookie expires - then any request to a page
     * in the forbidden-unless-agreed set, is redirected to the controller. This avoids showing a 400 error
     * if these pages are refreshed after being dormant for a long period. This can typically happen on mobile
     * devices where a browser is woken up.
     */
    if (initialized && forbiddenUnlessAgreedSet.includes(request.path)) {
      return h.redirect(CONTROLLER.uri).takeover()
    }
  }

  return h.continue
}

export default sessionManager
