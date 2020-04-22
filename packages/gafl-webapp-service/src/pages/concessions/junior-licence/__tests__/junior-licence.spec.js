import { JUNIOR_LICENCE, CONTROLLER, LICENCE_SUMMARY } from '../../../../constants.js'
import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The junior licence page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', JUNIOR_LICENCE.uri)
    expect(data.statusCode).toBe(200)
  })
  it('on submission redirects to the licence summary', async () => {
    await injectWithCookie('POST', JUNIOR_LICENCE.uri)
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })
})
