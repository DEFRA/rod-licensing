import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'
import { NO_LICENCE_REQUIRED } from '../../../../uri.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

describe('The no licence required page', () => {
  it('Return success on requesting', async () => {
    const data = await injectWithCookies('GET', NO_LICENCE_REQUIRED.uri)
    expect(data.statusCode).toBe(200)
  })
})
