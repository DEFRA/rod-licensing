import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils.js'
import { NO_LICENCE_REQUIRED } from '../../../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The no licence required page', () => {
  it('Return success on requesting', async () => {
    const data = await injectWithCookies('GET', NO_LICENCE_REQUIRED.uri)
    expect(data.statusCode).toBe(200)
  })
})
