import { initialize, injectWithCookies, start, stop } from '../../../../__mocks__/test-utils-system.js'
import { PAYMENT_FAILED } from '../../../../uri.js'

beforeAll(() => start(() => {}))
beforeAll(() => initialize(() => {}))
afterAll(() => stop(() => {}))

describe('The payment failed handler', () => {
  it('throws a status 403 (forbidden) exception if the payment created flag is not set', async () => {
    const data = await injectWithCookies('GET', PAYMENT_FAILED.uri)
    expect(data.statusCode).toBe(403)
  })
})
