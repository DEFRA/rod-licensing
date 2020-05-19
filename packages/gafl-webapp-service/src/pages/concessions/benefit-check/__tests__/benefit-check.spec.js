import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'
import { BENEFIT_CHECK, BLUE_BADGE_CHECK, TEST_TRANSACTION } from '../../../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The benefit check page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookies('GET', BENEFIT_CHECK.uri)
    expect(data.statusCode).toBe(200)
  })
  it('redirects back to itself on an empty response', async () => {
    const data = await injectWithCookies('POST', BENEFIT_CHECK.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_CHECK.uri)
  })
  it('redirects back to itself on an invalid response', async () => {
    const data = await injectWithCookies('POST', BENEFIT_CHECK.uri, { 'benefit-check': 'false' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_CHECK.uri)
  })
  it('the controller redirects to the blue badge check page when answering no', async () => {
    const data = await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_CHECK.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].concessions).toBeFalsy()
  })
  it('the controller redirects to the ni page when answering yes', async () => {
    const data = await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'yes' })
    expect(data.statusCode).toBe(302)
    // expect(data.headers.location).toBe(NAME.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].concessions).toBeFalsy()
  })
})
