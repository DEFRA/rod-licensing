import { LICENCE_LENGTH, LICENCE_SUMMARY, LICENCE_START_TIME, TEST_TRANSACTION } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The licence length page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', LICENCE_LENGTH.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', LICENCE_LENGTH.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const response = await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '8M' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it.each([
    ['12 months', '12M'],
    ['8 day', '8D'],
    ['1 day', '1D']
  ])('stores the transaction on a successful submission of %s', async (desc, lenCode) => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': lenCode })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe(lenCode)
  })

  it('redirects into the licence summary page for licence length of 12 months', async () => {
    const response = await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it.each([
    ['8 day', '8D'],
    ['1 day', '1D']
  ])('redirects into the time to start page for licence length %s', async (desc, lenCode) => {
    const response = await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': lenCode })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_START_TIME.uri)
  })
})
