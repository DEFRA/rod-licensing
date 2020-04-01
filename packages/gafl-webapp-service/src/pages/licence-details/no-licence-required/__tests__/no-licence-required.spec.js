import { start, stop, initialize, injectWithCookie } from '../../../../misc/test-utils.js'
import { NO_LICENCE_REQUIRED } from '../../../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The no licence required page', () => {
  it('Return success on requesting', async () => {
    const data = await injectWithCookie('GET', NO_LICENCE_REQUIRED.uri)
    expect(data.statusCode).toBe(200)
  })
})
