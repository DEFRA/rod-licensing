import { start, stop, initialize, injectWithCookies, injectWithoutSessionCookie } from '../../__mocks__/test-utils.js'
import {
  CONTROLLER,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  ORDER_COMPLETE,
  ORDER_COMPLETE_PDF,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED
} from '../../uri.js'
import each from 'jest-each'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The user', () => {
  it('clearing the session cookie automatically create a new cookie and cache', async () => {
    const data = await injectWithoutSessionCookie('GET', LICENCE_TYPE.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Clearing the session cookie will redirect to the start of the journey on a post valid response', async () => {
    let data = await injectWithoutSessionCookie('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookies('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  /*
   * The reason it must it that the error handler built into hapi acts before the request pre-handler and so
   * will throw an exception on the cache read failure because the pre-handler has not had time to restore the
   * cookie and reinitialize the cache. This is caught and the controller is invoked with a redirect
   */
  it('clearing the session cookie will redirect to the start of the journey on a post invalid response', async () => {
    let data = await injectWithoutSessionCookie('POST', LICENCE_TYPE.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookies('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  /*
   * With a new cookie, any attempt to access a handler which is protected unless the agreed flag is set will cause a redirect to the controller
   */
  each([
    ['order-complete', ORDER_COMPLETE],
    ['order-complete-pdf', ORDER_COMPLETE_PDF],
    ['payment-failed', PAYMENT_FAILED],
    ['payment-failed', PAYMENT_CANCELLED]
  ]).it('redirects to the controller on attempting to access %s', async (desc, page) => {
    const data = await injectWithoutSessionCookie('GET', page.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
  })
})
