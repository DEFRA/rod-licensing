import {
  BUY_OR_RENEW,
  DATE_OF_BIRTH,
  IDENTIFY
} from '../../../uri.js'
import { start, stop, initialize, injectWithCookies } from '../../../__mocks__/test-utils-system.js'
import { buyOrRenew } from '../route.js'

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
      'buy-or-renew': buyOrRenew.buy
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  it("on setting 'renew' it causes a redirect to the renewal identify page", async () => {
    const response = await injectWithCookies('POST', BUY_OR_RENEW.uri, {
      'buy-or-renew': buyOrRenew.renew
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(IDENTIFY.uri)
  })
})
