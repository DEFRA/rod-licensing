import { v4 as uuidv4 } from 'uuid'
import db from 'debug'
import addPermission from './add-permission.js'

import {
  CONTROLLER,
  AGREED,
  NEW_TRANSACTION,
  ORDER_COMPLETE,
  LICENCE_DETAILS,
  PAYMENT_FAILED,
  PAYMENT_CANCELLED,
  TEST_TRANSACTION,
  TEST_STATUS,
  REFUND_POLICY,
  PRIVACY_POLICY,
  ACCESSIBILITY_STATEMENT,
  COOKIES
} from '../uri.js'
import { initialiseAnalyticsSessionData } from '../processors/analytics.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'

const debug = db('webapp:session-manager')

const agreedHandlerProtectionExemptSet = [
  NEW_TRANSACTION.uri,
  CONTROLLER.uri,
  AGREED.uri,
  ORDER_COMPLETE.uri,
  LICENCE_DETAILS.uri,
  PAYMENT_FAILED.uri,
  PAYMENT_CANCELLED.uri,
  TEST_TRANSACTION.uri,
  TEST_STATUS.uri,
  REFUND_POLICY.uri,
  PRIVACY_POLICY.uri,
  ACCESSIBILITY_STATEMENT.uri,
  COOKIES.uri
]

// regex for /renew/{referenceNumber?}, /buy/renew/identify and /renew-my-licence/{referenceNumber?}
const startProtectionExemptSet = [/^\/renew\/.*$/, /^\/buy\/renew\/identify$/, /^\/renew-my-licence\/.*$/]

const staticMatcherPublic = /^(?:\/public\/.*|\/robots.txt|\/favicon.ico)/
const staticMatcherOidc = /^\/oidc\/.*/

export const isStaticResource = request => staticMatcherPublic.test(request.path)
export const useSessionCookie = request => !isStaticResource(request) && !staticMatcherOidc.test(request.path)

export const includesRegex = (str, regexArray) => regexArray.some(regex => regex.test(str))

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
      debug(`New session cookie: ${id} create on ${request.path}`)
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
      const { id } = request.state[sessionCookieName]
      /*
       * Keep the cookie alive so that is persists as long as the cache -
       * the cache has the TTL reset on each write
       */
      h.state(sessionCookieName, { id })
    }

    /*
     * Once the agreed flag is set then any request to the service is redirected to the agreed handler
     * except for the set in the array which includes the order-complete and new transaction pages and the agreed handler itself.
     */
    const status = await request.cache().helpers.status.get()
    if (status.agreed && !agreedHandlerProtectionExemptSet.includes(request.path)) {
      return h.redirect(addLanguageCodeToUri(request, AGREED.uri)).takeover()
    }

    /*
     * If no permission has been initialized, then create one.
     */
    if (!(await request.cache().helpers.transaction.hasPermission(request))) {
      await addPermission(request)
    }

    /*
     * If we have a new cookie/cache - covering the cases where the cookie expires - then any request to a page
     * is redirected to the controller.
     * if these pages are refreshed after being dormant for a long period. This can typically happen on mobile
     * devices where a browser is woken up.
     */
    if (initialized) {
      await initialiseAnalyticsSessionData(request)
      if (!includesRegex(request.path, startProtectionExemptSet)) {
        return h.redirect(CONTROLLER.uri).takeover()
      }
    }
  }

  return h.continue
}

export default sessionManager
