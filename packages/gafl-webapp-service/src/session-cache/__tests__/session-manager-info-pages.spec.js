import { start, stop, initialize, injectWithoutSessionCookie } from '../../__mocks__/test-utils-system.js'
import { COOKIES, PRIVACY_POLICY, REFUND_POLICY, ACCESSIBILITY_STATEMENT } from '../../uri.js'

describe('Session Exempt Informational Pages', () => {
  beforeAll(() => new Promise(resolve => start(resolve)))
  beforeAll(() => new Promise(resolve => initialize(resolve)))
  afterAll(d => stop(d))

  it.each([
    ['cookies', COOKIES.uri],
    ['privacy policy', PRIVACY_POLICY.uri],
    ['refund policy', REFUND_POLICY.uri],
    ['accessibility statement', ACCESSIBILITY_STATEMENT.uri]
  ])('should allow direct access to %s page without session', async (_desc, uri) => {
    const response = await injectWithoutSessionCookie('GET', uri)
    expect(response.statusCode).toBe(200)
  })
})
