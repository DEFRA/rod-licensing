import {
  BUY_OR_RENEW,
  IDENTIFY,
  LICENCE_FOR
} from '../../../uri.js'
import { start, stop, initialize, injectWithCookies } from '../../../__mocks__/test-utils-system.js'
import { buyNewLicence } from '../result-function'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll((d) => stop(d))

describe('The start page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', BUY_OR_RENEW.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', BUY_OR_RENEW.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(BUY_OR_RENEW.uri)
  })

  it("on setting 'buy' it causes a redirect to the date of birth page", async () => {
    const response = await injectWithCookies('POST', BUY_OR_RENEW.uri, {
      'buy-or-renew': buyNewLicence.BUY
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_FOR.uri)
  })

  it("on setting 'renew' it causes a redirect to the renewal identify page", async () => {
    const response = await injectWithCookies('POST', BUY_OR_RENEW.uri, {
      'buy-or-renew': buyNewLicence.RENEW
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(IDENTIFY.uri)
  })
})
