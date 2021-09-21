import { initialize, injectWithCookies, start, stop } from '../../../../__mocks__/test-utils-system.js'
import { PAYMENT_CANCELLED } from '../../../../uri.js'

beforeAll(() => start(() => {}))
beforeAll(() => initialize(() => {}))
afterAll(() => stop(() => {}))

describe('The payment cancelled handler', () => {
  it('throws a status 403 (forbidden) exception if the payment created flag is not set', async () => {
    const data = await injectWithCookies('GET', PAYMENT_CANCELLED.uri)
    expect(data.statusCode).toBe(403)
  })
})
