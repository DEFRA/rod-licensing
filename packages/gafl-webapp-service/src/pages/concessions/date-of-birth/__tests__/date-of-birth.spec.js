import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'
import { DATE_OF_BIRTH, DISABILITY_CONCESSION, LICENCE_FOR, NO_LICENCE_REQUIRED } from '../../../../uri.js'
import {
  ADULT_TODAY,
  SENIOR_TODAY,
  JUNIOR_AT_ADVANCE_PURCHASE_MAX,
  MINOR_AT_ADVANCE_PURCHASE_MAX,
  DATE_AT_ADVANCED_PURCHASE_MAX_DAYS,
  dobHelper
} from '../../../../__mocks__/test-utils-business-rules.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

describe('The date of birth page', () => {
  it('redirects back to LICENCE_FOR if not been on already', async () => {
    const response = await injectWithCookies('GET', DATE_OF_BIRTH.uri)
    expect(response.headers.location).toHaveValidPathFor(LICENCE_FOR.uri)
  })

  it('return success on requesting the page', async () => {
    await injectWithCookies('POST', LICENCE_FOR.uri, { 'licence-for': 'you' })
    const response = await injectWithCookies('GET', DATE_OF_BIRTH.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(DATE_OF_BIRTH.uri)
  })

  it('redirects back to itself on posting an invalid date', async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '45',
      'date-of-birth-month': '13',
      'date-of-birth-year': '1970'
    })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(DATE_OF_BIRTH.uri)
  })

  it('redirects to the disability-concession page on posting a date of birth for an adult licence', async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(SENIOR_TODAY))
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(DISABILITY_CONCESSION.uri)
  })

  it('redirects to the disability-concession page on posting a date of birth for an adult licence', async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(DISABILITY_CONCESSION.uri)
  })

  it(`redirects to the disability-concession page if a junior on ${DATE_AT_ADVANCED_PURCHASE_MAX_DAYS.format(
    'YYYY-MM-DD'
  )} - i.e. born ${JUNIOR_AT_ADVANCE_PURCHASE_MAX.format('YYYY-MM-DD')}`, async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_AT_ADVANCE_PURCHASE_MAX))
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(DISABILITY_CONCESSION.uri)
  })

  it(`redirects to the no-licence-required page if a minor on ${DATE_AT_ADVANCED_PURCHASE_MAX_DAYS.format(
    'YYYY-MM-DD'
  )} - i.e. born ${MINOR_AT_ADVANCE_PURCHASE_MAX.format('YYYY-MM-DD')}`, async () => {
    const response = await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(MINOR_AT_ADVANCE_PURCHASE_MAX))
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(NO_LICENCE_REQUIRED.uri)
  })
})
