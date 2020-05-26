import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'
import { BLUE_BADGE_CHECK, BLUE_BADGE_NUMBER, LICENCE_SUMMARY, TEST_TRANSACTION } from '../../../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The blue badge check page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookies('GET', BLUE_BADGE_CHECK.uri)
    expect(data.statusCode).toBe(200)
  })
  it('redirects back to itself on an empty response', async () => {
    const data = await injectWithCookies('POST', BLUE_BADGE_CHECK.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_CHECK.uri)
  })
  it('redirects back to itself on an invalid response', async () => {
    const data = await injectWithCookies('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'false' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_CHECK.uri)
  })
  it('the controller redirects to the licence summary page when answering no', async () => {
    const data = await postRedirectGet(BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'no' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].concessions).toBeFalsy()
  })
  it('the controller redirects to the blue badge number page when answering yes', async () => {
    const data = await postRedirectGet(BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'yes' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_NUMBER.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].concessions).toBeFalsy()
  })
})
