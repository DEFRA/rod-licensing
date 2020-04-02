import { SUMMARY } from '../../../constants.js'
import { start, stop, initialize, injectWithCookie } from '../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The summary page', () => {
  it('return success on requesting', async () => {
    const data = await injectWithCookie('GET', SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })
})
