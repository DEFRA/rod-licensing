import { initialize, injectWithCookies, start, stop } from '../../../../__mocks__/test-utils.js'
import { PAYMENT_FAILED } from '../../../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The payment failed handler', () => {
  it('throws a status 403 (forbidden) exception if the payment created flag is not set', async () => {
    const data = await injectWithCookies('GET', PAYMENT_FAILED.uri)
    expect(data.statusCode).toBe(403)
  })
})
