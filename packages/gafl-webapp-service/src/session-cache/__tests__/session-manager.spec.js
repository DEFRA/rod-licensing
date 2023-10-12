import { start, stop, initialize, injectWithCookies, injectWithoutSessionCookie, mockSalesApi } from '../../__mocks__/test-utils-system.js'
import sessionManager, { isStaticResource, useSessionCookie, includesRegex } from '../session-manager.js'
import { licenseTypes } from '../../pages/licence-details/licence-type/route.js'
import {
  CONTROLLER,
  LICENCE_FOR,
  LICENCE_TYPE,
  ORDER_COMPLETE,
  LICENCE_DETAILS,
  PAYMENT_CANCELLED,
  PAYMENT_FAILED,
  IDENTIFY,
  AGREED
} from '../../uri.js'

mockSalesApi()

describe('isStaticResource', () => {
  it('returns false for path which are not a static resource', () => {
    expect(isStaticResource({ path: '/foo' })).toBeFalsy()
  })

  it.each(['/public/this/path/doesnt/work', '/public/nor/does/this/one', '/public/this/one/too', '/robots.txt'])(
    'returns true for paths which are static resources (%s)',
    path => {
      expect(isStaticResource({ path })).toBeTruthy()
    }
  )
})

describe('includesRegex', () => {
  const regexArray = [/^\/buy\/renew\/identify$/, /^\/renew\/.*$/, /^\/renew-my-licence\/.*$/]
  it.each([
    '/buy/renew/identify',
    '/renew/ABC123',
    '/renew/123123',
    '/renew/ABCDEF',
    '/renew/anytext',
    '/renew-my-licence/ABC123',
    '/renew-my-licence/123123',
    '/renew-my-licence/ABCDEF',
    '/renew-my-licence/anytext'
  ])('returns true if one of the regexes is matched %s', async path => {
    expect(includesRegex(path, regexArray)).toBeTruthy()
  })

  it.each(['/buy/renew', '/buy', '/rene', '/buy/order-complete'])('returns false if one of the regexes is not matched %s', async path => {
    expect(includesRegex(path, regexArray)).toBeFalsy()
  })
})

describe('Use session cookie', () => {
  it('path not starting with /public marked as using a session cookie', () => {
    expect(useSessionCookie({ path: '/foo' })).toBeTruthy()
  })

  it.each(['/public/this/path/doesnt/work', '/public/nor/does/this/one', '/public/this/one/too', '/robots.txt'])(
    "path %s doesn't require session cookie",
    path => {
      expect(useSessionCookie({ path })).toBeFalsy()
    }
  )
})

describe('The user', () => {
  beforeAll(() => new Promise(resolve => start(resolve)))
  beforeAll(() => new Promise(resolve => initialize(resolve)))
  afterAll(d => stop(d))

  it('clearing the session cookie automatically creates a new cookie and cache', async () => {
    const response = await injectWithoutSessionCookie('GET', LICENCE_TYPE.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })

  it('Clearing the session cookie will redirect to the start of the journey on a post valid response', async () => {
    await injectWithoutSessionCookie('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    const response = await injectWithCookies('GET', CONTROLLER.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_FOR.uri)
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
    expect(response.headers.location).toHaveValidPathFor(LICENCE_FOR.uri)
  })

  /*
   * With a new cookie, any attempt to access a handler which is protected unless the agreed flag is set will cause a redirect to the controller
   */
  it.each([
    ['order-complete', ORDER_COMPLETE],
    ['licence-details', LICENCE_DETAILS],
    ['payment-failed', PAYMENT_FAILED],
    ['payment-failed', PAYMENT_CANCELLED]
  ])('redirects to the controller on attempting to access %s', async (desc, page) => {
    const response = await injectWithoutSessionCookie('GET', page.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })

  it(`returns 200 when attempting to access ${IDENTIFY.uri}`, async () => {
    const response = await injectWithoutSessionCookie('GET', IDENTIFY.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects to /buy/renew/identify when attempting to access /renew/ABC123', async () => {
    const response = await injectWithoutSessionCookie('GET', '/renew/ABC123')
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(IDENTIFY.uri)
  })
})

describe('takeover by agreed handler once agreed flag is set', () => {
  const sessionCookieName = 'garibaldi'
  const getMockRequest = () => ({
    path: 'crazy-paving',
    state: {
      [sessionCookieName]: {
        id: 'a disappointing currant embedded biscuit'
      }
    },
    cache: () => ({
      helpers: {
        status: {
          get: async () => ({
            agreed: true
          })
        }
      }
    })
  })
  const getMockToolkit = (takeover = () => {}) => ({
    state: () => {},
    redirectWithLanguageCode: jest.fn(() => ({
      takeover
    }))
  })
  const initialisedSessionManager = sessionManager(sessionCookieName)

  beforeEach(jest.clearAllMocks)

  it("redirects to agreed handler when status is already agreed and request path isn't in exempt set", async () => {
    const request = getMockRequest()
    const toolkit = getMockToolkit()
    await initialisedSessionManager(request, toolkit)
    expect(toolkit.redirectWithLanguageCode).toHaveBeenCalledWith(AGREED.uri)
  })

  it('returns a takeover response after redirect', async () => {
    const takeoverResponse = Symbol('takeover')
    const response = await initialisedSessionManager(
      getMockRequest(),
      getMockToolkit(() => takeoverResponse)
    )
    expect(response).toBe(takeoverResponse)
  })
})
