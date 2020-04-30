import moment from 'moment'
import * as concessionHelper from '../../../../processors/concession-helper.js'
import { start, stop, initialize, injectWithCookie, postRedirectGet } from '../../../../__mocks__/test-utils.js'
import {
  DATE_OF_BIRTH,
  LICENCE_TO_START,
  LICENCE_START_DATE,
  LICENCE_LENGTH,
  NO_LICENCE_REQUIRED,
  JUNIOR_LICENCE,
  LICENCE_SUMMARY,
  BENEFIT_CHECK,
  TEST_TRANSACTION
} from '../../../../constants.js'
import { MINOR_MAX_AGE, JUNIOR_MAX_AGE, SENIOR_MIN_AGE } from '@defra-fish/business-rules-lib'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const dobJuniorToday = moment().subtract(MINOR_MAX_AGE + 1, 'years')
const dobJuniorTomorrow = moment()
  .subtract(MINOR_MAX_AGE + 1, 'years')
  .add(1, 'day')
const dobAdultToday = moment().subtract(JUNIOR_MAX_AGE + 1, 'years')
const dobAdultTomorrow = moment()
  .subtract(JUNIOR_MAX_AGE + 1, 'years')
  .add(1, 'day')
const dobSeniorToday = moment().add(-SENIOR_MIN_AGE, 'years')
const dobSeniorTomorrow = moment()
  .add(-SENIOR_MIN_AGE, 'years')
  .add(1, 'day')

const dobHelper = d => ({
  'date-of-birth-day': d.date().toString(),
  'date-of-birth-month': (d.month() + 1).toString(),
  'date-of-birth-year': d.year()
})

const startDateHelper = d => ({
  'licence-start-date-day': d.date().toString(),
  'licence-start-date-month': (d.month() + 1).toString(),
  'licence-start-date-year': d.year()
})

describe('The date of birth page', () => {
  it('redirects to the licence to start page if it is not set', async () => {
    const data = await injectWithCookie('GET', DATE_OF_BIRTH.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it('return success on requesting the page', async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    const data = await injectWithCookie('GET', DATE_OF_BIRTH.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', DATE_OF_BIRTH.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  it('redirects back to itself on posting an invalid date', async () => {
    const data = await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '45',
      'date-of-birth-month': '13',
      'date-of-birth-year': '1970'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  /*
   * These tests are for licences starting today
   */
  it(`my licence starts immediately after payment, my date of birth is ${dobJuniorTomorrow.format(
    'YYYY-MM-DD'
  )} and I do not require a fishing licence`, async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobJuniorTomorrow))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NO_LICENCE_REQUIRED.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobJuniorTomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).toBeTruthy()
  })

  it(`my licence starts immediately after payment, my date of birth is ${dobJuniorToday.format(
    'YYYY-MM-DD'
  )} and I require a junior 12 month fishing licence`, async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobJuniorToday))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(JUNIOR_LICENCE.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobJuniorToday.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).not.toBeTruthy()
    expect(concessionHelper.hasJunior(JSON.parse(payload).permissions[0])).toBeTruthy()
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('12M')
  })

  it(`my licence starts immediately after payment, my date of birth is ${dobAdultTomorrow.format(
    'YYYY-MM-DD'
  )} and I require a 12 month fishing licence and with a junior concession`, async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobAdultTomorrow))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(JUNIOR_LICENCE.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobAdultTomorrow.format('YYYY-MM-DD'))
    expect(concessionHelper.hasJunior(JSON.parse(payload).permissions[0])).toBeTruthy()
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).not.toBeTruthy()
  })

  it(`my licence starts immediately after payment, my date of birth is ${dobAdultToday.format(
    'YYYY-MM-DD'
  )} and I require an adult fishing licence`, async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobAdultToday))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobAdultToday.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concessions.length).toBe(0)
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })

  it(`my licence starts immediately after payment, my date of birth is ${dobSeniorTomorrow.format(
    'YYYY-MM-DD'
  )} and I require an adult fishing licence`, async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobSeniorTomorrow))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobSeniorTomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concessions.length).toBe(0)
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })

  it(`my licence starts immediately after payment, my date of birth is ${dobSeniorToday.format(
    'YYYY-MM-DD'
  )} and I am entitled to a senior concession`, async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobSeniorToday))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobSeniorToday.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).not.toBeTruthy()
    expect(concessionHelper.hasSenior(JSON.parse(payload).permissions[0])).toBeTruthy()
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })

  /*
   * These tests are for licences starting tomorrow
   */
  it(`my licence starts tomorrow, my date of birth is ${dobJuniorTomorrow.format(
    'YYYY-MM-DD'
  )} and I require a fishing licence with a junior concession`, async () => {
    const fdate = moment().add(1, 'days')
    await postRedirectGet(LICENCE_START_DATE.uri, startDateHelper(fdate))
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobJuniorTomorrow))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(JUNIOR_LICENCE.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobJuniorTomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).not.toBeTruthy()
    expect(concessionHelper.hasJunior(JSON.parse(payload).permissions[0])).toBeTruthy()
  })

  it(`my licence starts tomorrow, my date of birth is ${dobAdultTomorrow.format(
    'YYYY-MM-DD'
  )} and I require a 12 month adult fishing licence`, async () => {
    const fdate = moment().add(1, 'days')
    await injectWithCookie('POST', LICENCE_START_DATE.uri, startDateHelper(fdate))
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobAdultTomorrow))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_CHECK.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobAdultTomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].concessions.length).toBe(0)
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).not.toBeTruthy()
  })

  it(`my licence starts tomorrow, my date of birth is ${dobSeniorTomorrow.format(
    'YYYY-MM-DD'
  )} and I am entitled to a senior concession`, async () => {
    const fdate = moment().add(1, 'days')
    await injectWithCookie('POST', LICENCE_START_DATE.uri, startDateHelper(fdate))
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobSeniorTomorrow))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.birthDate).toBe(dobSeniorTomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].licensee.noLicenceRequired).not.toBeTruthy()
    expect(concessionHelper.hasSenior(JSON.parse(payload).permissions[0])).toBeTruthy()
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })
})
