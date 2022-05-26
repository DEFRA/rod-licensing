import { initialize, injectWithCookies, start, stop } from '../../../../__mocks__/test-utils-system.js'
import { PAYMENT_FAILED } from '../../../../uri.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

describe('The payment failed handler', () => {
  it('throws a status 403 (forbidden) exception if the payment created flag is not set', async () => {
    const data = await injectWithCookies('GET', PAYMENT_FAILED.uri)
    expect(data.statusCode).toBe(403)
  })
})
