import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'
import { BLUE_BADGE_NUMBER, CONTROLLER, NAME, BLUE_BADGE_CHECK } from '../../../../constants.js'
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

  it('the controller redirects to the name page on a valid response and sets the number in the transaction', async () => {
    await injectWithCookie('POST', BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'yes' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', BLUE_BADGE_NUMBER.uri, { 'blue-badge-number': '1234' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(concessionHelper.hasDisabled(JSON.parse(payload).permissions[0].licensee)).toBeTruthy()
    expect(JSON.parse(payload).permissions[0].licensee.concessions[0].proof).toEqual({
      type: CONCESSION_PROOF.blueBadge,
      referenceNumber: '1234'
    })
  })
})
