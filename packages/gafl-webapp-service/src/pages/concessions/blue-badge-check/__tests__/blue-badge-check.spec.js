import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'
import { BLUE_BADGE_CHECK, BLUE_BADGE_NUMBER, CONTROLLER, NAME } from '../../../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The blue badge check page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', BLUE_BADGE_CHECK.uri)
    expect(data.statusCode).toBe(200)
  })
  it('redirects back to itself on an empty response', async () => {
    const data = await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_CHECK.uri)
  })
  it('redirects back to itself on an invalid response', async () => {
    const data = await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'false' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_CHECK.uri)
  })
  it('the controller redirects to the name page when answering no', async () => {
    await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'no' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.concessions).toBeFalsy()
  })
  it('the controller redirects to the blue badge number page when answering yes', async () => {
    await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'yes' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_NUMBER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.concessions).toBeFalsy()
  })
})
