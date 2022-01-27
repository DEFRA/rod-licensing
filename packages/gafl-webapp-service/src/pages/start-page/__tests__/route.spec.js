import {
  START_PAGE,
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
    const response = await injectWithCookies('GET', START_PAGE.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', START_PAGE.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(START_PAGE.uri)
  })

  it("on setting 'buy' it causes a redirect to the date of birth page", async () => {
    const response = await injectWithCookies('POST', START_PAGE.uri, {
      'start-page': buyOrRenew.buy
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  it("on setting 'renew' it causes a redirect to the date of birth page", async () => {
    const response = await injectWithCookies('POST', START_PAGE.uri, {
      'start-page': buyOrRenew.buy
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(IDENTIFY.uri)
  })
})
