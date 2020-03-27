import moment from 'moment'
import { start, stop, initialize, injectWithCookie } from '../../../../misc/test-utils.js'
import {
  DATE_OF_BIRTH,
  LICENCE_TO_START,
  LICENCE_START_DATE,
  LICENCE_LENGTH,
  NO_LICENCE_REQUIRED,
  JUNIOR_LICENCE,
  CONTROLLER,
  NAME,
  CONCESSION,
  BENEFIT_CHECK
} from '../../../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const dob13Today = moment().add(-13, 'years')
const dob13Tomorrow = moment()
  .add(-13, 'years')
  .add(1, 'day')
const dob16Today = moment().add(-16, 'years')
const dob16Tomorrow = moment()
  .add(-16, 'years')
  .add(1, 'day')
const dob65Today = moment().add(-65, 'years')
const dob65Tomorrow = moment()
  .add(-65, 'years')
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
  it('return success on requesting the page', async () => {
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

  it('redirects back to the start of the journey where there is no licence start date', async () => {
    let data = await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '5',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1970'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  /*
   * These tests are for licences starting today
   */
  it(`my licence starts immediately after payment, my date of birth is ${dob13Tomorrow.format(
    'YYYY-MM-DD'
  )} and I do not require a fishing licence`, async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob13Tomorrow))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NO_LICENCE_REQUIRED.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob13Tomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).toBeTruthy()
  })

  it(`my licence starts immediately after payment, my date of birth is ${dob13Today.format(
    'YYYY-MM-DD'
  )} and I require a junior 12 month fishing licence`, async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob13Today))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(JUNIOR_LICENCE.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob13Today.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concession).toBe(CONCESSION.JUNIOR)
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('12M')
  })

  it(`my licence starts immediately after payment, my date of birth is ${dob16Tomorrow.format(
    'YYYY-MM-DD'
  )} and I require a 12 month fishing licence and with a junior concession`, async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob16Tomorrow))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(JUNIOR_LICENCE.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob16Tomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].concession).toBe(CONCESSION.JUNIOR)
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
  })

  it(`my licence starts immediately after payment, my date of birth is ${dob16Today.format(
    'YYYY-MM-DD'
  )} and I require an adult fishing licence`, async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob16Today))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_CHECK.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob16Today.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concession).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })

  it(`my licence starts immediately after payment, my date of birth is ${dob65Tomorrow.format(
    'YYYY-MM-DD'
  )} and I require an adult fishing licence`, async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob65Tomorrow))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_CHECK.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob65Tomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concession).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })

  it(`my licence starts immediately after payment, my date of birth is ${dob65Today.format(
    'YYYY-MM-DD'
  )} and I am entitled to a senior concession`, async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob65Today))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob65Today.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concession).toBe(CONCESSION.SENIOR)
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })

  /*
   * These tests are for licences starting tomorrow
   */

  it(`my licence starts tomorrow, my date of birth is ${dob13Tomorrow.format(
    'YYYY-MM-DD'
  )} and I require a fishing licence with a junior concession`, async () => {
    const fdate = moment().add(1, 'days')
    await injectWithCookie('POST', LICENCE_START_DATE.uri, startDateHelper(fdate))
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob13Tomorrow))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(JUNIOR_LICENCE.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob13Tomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concession).toBe(CONCESSION.JUNIOR)
  })

  it(`my licence starts tomorrow, my date of birth is ${dob16Tomorrow.format(
    'YYYY-MM-DD'
  )} and I require a 12 month adult fishing licence`, async () => {
    const fdate = moment().add(1, 'days')
    await injectWithCookie('POST', LICENCE_START_DATE.uri, startDateHelper(fdate))
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob16Tomorrow))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(BENEFIT_CHECK.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob16Tomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].concession).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
  })

  it(`my licence starts tomorrow, my date of birth is ${dob65Tomorrow.format(
    'YYYY-MM-DD'
  )} and I am entitled to a senior concession`, async () => {
    const fdate = moment().add(1, 'days')
    await injectWithCookie('POST', LICENCE_START_DATE.uri, startDateHelper(fdate))
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, dobHelper(dob65Tomorrow))
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob65Tomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concession).toBe(CONCESSION.SENIOR)
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })
})
