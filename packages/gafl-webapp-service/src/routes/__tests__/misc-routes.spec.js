import { start, stop, injectWithCookies, initialize } from '../../__mocks__/test-utils-system.js'
import { REFUND_POLICY, ACCESSIBILITY_STATEMENT, COOKIES, PRIVACY_POLICY, RENEWAL_PUBLIC, IDENTIFY, CONTROLLER, NEW_PRICES, RECURRING_TERMS_CONDITIONS } from '../../uri.js'

// Start application before running the test case
beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The miscellaneous route handlers', () => {
  it('redirect to the main controller when / is requested', async () => {
    const data = await injectWithCookies('GET', '/')
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })

  it('return the refund policy page when requested', async () => {
    const data = await injectWithCookies('GET', REFUND_POLICY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the privacy policy page when requested', async () => {
    const data = await injectWithCookies('GET', PRIVACY_POLICY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the accessibility statement page when requested', async () => {
    const data = await injectWithCookies('GET', ACCESSIBILITY_STATEMENT.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the cookie page when requested', async () => {
    const data = await injectWithCookies('GET', COOKIES.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the new prices page when requested', async () => {
    const data = await injectWithCookies('GET', NEW_PRICES.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the recurring payment terms and conditions page when requested', async () => {
    const data = await injectWithCookies('GET', RECURRING_TERMS_CONDITIONS.uri)
    expect(data.statusCode).toBe(200)
  })

  it('The easy renewals shortcut route redirects correctly', async () => {
    const data = await injectWithCookies('GET', RENEWAL_PUBLIC.uri.replace('{referenceNumber}', 'AAAAAA'))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toHaveValidPathFor(`${IDENTIFY.uri.replace('{referenceNumber}', 'AAAAAA')}#`)
  })
})
