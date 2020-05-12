import { start, stop, initialize, injectWithCookie, postRedirectGet } from '../../../../__mocks__/test-utils.js'
import { BLUE_BADGE_NUMBER, LICENCE_SUMMARY, BLUE_BADGE_CHECK, TEST_TRANSACTION } from '../../../../uri.js'
import * as concessionHelper from '../../../../processors/concession-helper.js'
import { CONCESSION_PROOF } from '../../../../processors/mapping-constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The blue badge number page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', BLUE_BADGE_NUMBER.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on an empty response', async () => {
    const data = await injectWithCookie('POST', BLUE_BADGE_NUMBER.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_NUMBER.uri)
  })

  it('redirects back to itself on an invalid response', async () => {
    const data = await injectWithCookie('POST', BLUE_BADGE_NUMBER.uri, { 'blue-badge-number': '0'.repeat(100) })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BLUE_BADGE_NUMBER.uri)
  })

  it('the controller redirects to the licence summary page on a valid response and sets the number in the transaction', async () => {
    await postRedirectGet(BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'yes' })
    const data = await postRedirectGet(BLUE_BADGE_NUMBER.uri, { 'blue-badge-number': '1234' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(concessionHelper.hasDisabled(JSON.parse(payload).permissions[0])).toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concessions[0].proof).toEqual({
      type: CONCESSION_PROOF.blueBadge,
      referenceNumber: '1234'
    })
  })
})
