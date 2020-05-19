import { JUNIOR_LICENCE, CONTROLLER, LICENCE_SUMMARY } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The junior licence page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookies('GET', JUNIOR_LICENCE.uri)
    expect(data.statusCode).toBe(200)
  })
  it('on submission redirects to the licence summary', async () => {
    await injectWithCookies('POST', JUNIOR_LICENCE.uri)
    const data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })
})
