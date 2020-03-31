import { start, stop, initialize, injectWithCookie } from '../../../../misc/test-utils.js'
import { BENEFIT_NI_NUMBER, CONTROLLER, NAME } from '../../../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The NI page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', BENEFIT_NI_NUMBER.uri)
    expect(data.statusCode).toBe(200)
  })
  it('redirects back to itself on an empty response', async () => {
    const data = await injectWithCookie('POST', BENEFIT_NI_NUMBER.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_NI_NUMBER.uri)
  })
  it('redirects back to itself on an invalid response', async () => {
    const data = await injectWithCookie('POST', BENEFIT_NI_NUMBER.uri, { 'ni-number': '01234567890123456' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_NI_NUMBER.uri)
  })
  it('the controller redirects to the name page on a valid response', async () => {
    await injectWithCookie('POST', BENEFIT_NI_NUMBER.uri, { 'benefit-check': 'no' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })
})
