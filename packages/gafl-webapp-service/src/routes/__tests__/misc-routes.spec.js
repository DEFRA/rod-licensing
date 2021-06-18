import { start, stop, injectWithCookies, initialize } from '../../__mocks__/test-utils-system.js'
import {
  REFUND_POLICY,
  ACCESSIBILITY_STATEMENT,
  COOKIES,
  PRIVACY_POLICY,
  RENEWAL_PUBLIC,
  IDENTIFY,
  LICENCE_SUMMARY,
  OS_TERMS,
  SET_CURRENT_PERMISSION
} from '../../uri.js'

// Start application before running the test case
beforeAll(d => start(d))
beforeAll(d => initialize(d))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The miscellaneous route handlers', () => {
  it('redirect to the main controller when / is requested', async () => {
    const data = await injectWithCookies('GET', '/')
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')
  })

  it('return the cookie page when requested', async () => {
    const data = await injectWithCookies('GET', COOKIES.uri)
    expect(data.statusCode).toBe(200)
  })

  it('The easy renewals shortcut route redirects correctly', async () => {
    const data = await injectWithCookies('GET', RENEWAL_PUBLIC.uri.replace('{referenceNumber}', 'AAAAAA'))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri.replace('{referenceNumber}', 'AAAAAA'))
  })

  describe('set current permission', () => {
    let data
    beforeAll(async () => {
      data = await injectWithCookies('GET', SET_CURRENT_PERMISSION.uri + '?permissionIndex=4')
    })

    it('sets the current permission index to the one provided', async () => {
      const status = await data.request.cache().helpers.status.get()
      expect(status.currentPermissionIdx).toBe(4)
    })

    it('redirects to the licence summary page', () => {
      expect(data.statusCode).toBe(302)
      expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    })
  })

  it('return the accessibility statement page when requested', async () => {
    const data = await injectWithCookies('GET', ACCESSIBILITY_STATEMENT.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the privacy policy page when requested', async () => {
    const data = await injectWithCookies('GET', PRIVACY_POLICY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the refund policy page when requested', async () => {
    const data = await injectWithCookies('GET', REFUND_POLICY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('return the OS terms page when requested', async () => {
    const data = await injectWithCookies('GET', OS_TERMS.uri)
    expect(data.statusCode).toBe(200)
  })
})
