import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'
import { DATE_OF_BIRTH, LICENCE_TO_START, NO_LICENCE_REQUIRED } from '../../../../uri.js'
import {
  ADULT_TODAY,
  JUNIOR_AT_ADVANCE_PURCHASE_MAX,
  MINOR_AT_ADVANCE_PURCHASE_MAX,
  DATE_AT_ADVANCED_PURCHASE_MAX_DAYS,
  dobHelper
} from '../../../../__mocks__/test-utils-business-rules.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The date of birth page', () => {
  it('return success on requesting the page', async () => {
    const response = await injectWithCookies('GET', DATE_OF_BIRTH.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  it('redirects back to itself on posting an invalid date', async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '45',
      'date-of-birth-month': '13',
      'date-of-birth-year': '1970'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  it('redirects to the licence-to-start page on posting a date of birth for an adult licence', async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it(`redirects to the licence-to-start page if a junior on ${DATE_AT_ADVANCED_PURCHASE_MAX_DAYS.format(
    'YYYY-MM-DD'
  )} - i.e. born ${JUNIOR_AT_ADVANCE_PURCHASE_MAX.format('YYYY-MM-DD')}`, async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_AT_ADVANCE_PURCHASE_MAX))
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it(`redirects to the no-licence-required page if a minor on ${DATE_AT_ADVANCED_PURCHASE_MAX_DAYS.format(
    'YYYY-MM-DD'
  )} - i.e. born ${MINOR_AT_ADVANCE_PURCHASE_MAX.format('YYYY-MM-DD')}`, async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(MINOR_AT_ADVANCE_PURCHASE_MAX))
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(NO_LICENCE_REQUIRED.uri)
  })
})
