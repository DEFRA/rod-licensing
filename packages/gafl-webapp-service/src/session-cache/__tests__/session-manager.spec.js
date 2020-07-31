import { start, stop, initialize, injectWithCookies, injectWithoutSessionCookie } from '../../__mocks__/test-utils.js'
import { useSessionCookie } from '../session-manager.js'
import { licenseTypes } from '../../pages/licence-details/licence-type/route.js'
import {
  CONTROLLER,
  DATE_OF_BIRTH,
  LICENCE_TYPE,
  ORDER_COMPLETE,
  ORDER_COMPLETE_PDF,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED
} from '../../uri.js'

describe('Use session cookie', () => {
  it('path not starting with /public marked as using a session cookie', () => {
    expect(useSessionCookie({ path: '/foo' })).toBeTruthy()
  })

  it.each(['/public/this/path/doesnt/work', '/public/nor/does/this/one', '/public/this/one/too'])(
    "path %s doesn't require session cookie",
    path => {
      expect(useSessionCookie({ path })).toBeFalsy()
    }
  )
})

describe('The user', () => {
  beforeAll(d => start(d))
  beforeAll(d => initialize(d))
  afterAll(d => stop(d))

  it('clearing the session cookie automatically create a new cookie and cache', async () => {
    const response = await injectWithoutSessionCookie('GET', LICENCE_TYPE.uri)
    expect(response.statusCode).toBe(200)
  })

  it('Clearing the session cookie will redirect to the start of the journey on a post valid response', async () => {
    await injectWithoutSessionCookie('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    const response = await injectWithCookies('GET', CONTROLLER.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  /*
   * The reason it must it that the error handler built into hapi acts before the request pre-handler and so
   * will throw an exception on the cache read failure because the pre-handler has not had time to restore the
   * cookie and reinitialize the cache. This is caught and the controller is invoked with a redirect
   */
  it('clearing the session cookie will redirect to the start of the journey on a post invalid response', async () => {
    await injectWithoutSessionCookie('POST', LICENCE_TYPE.uri, {})
    const response = await injectWithCookies('GET', CONTROLLER.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  /*
   * With a new cookie, any attempt to access a handler which is protected unless the agreed flag is set will cause a redirect to the controller
   */
  it.each([
    ['order-complete', ORDER_COMPLETE],
    ['order-complete-pdf', ORDER_COMPLETE_PDF],
    ['payment-failed', PAYMENT_FAILED],
    ['payment-failed', PAYMENT_CANCELLED]
  ])('redirects to the controller on attempting to access %s', async (desc, page) => {
    const response = await injectWithoutSessionCookie('GET', page.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(CONTROLLER.uri)
  })
})
