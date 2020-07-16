import { salesApi } from '@defra-fish/connectors-lib'
import mockPermits from '../../../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../../__mocks__/data/permit-concessions.js'
import mockConcessions from '../../../../__mocks__/data/concessions.js'
import { JUNIOR_MAX_AGE, MINOR_MAX_AGE, SENIOR_MIN_AGE } from '@defra-fish/business-rules-lib'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet, backLinkRegEx } from '../../../../__mocks__/test-utils.js'

import {
  LICENCE_SUMMARY,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  NUMBER_OF_RODS,
  LICENCE_TO_START,
  BENEFIT_CHECK,
  BENEFIT_NI_NUMBER,
  BLUE_BADGE_CHECK,
  BLUE_BADGE_NUMBER,
  LICENCE_START_DATE,
  LICENCE_START_TIME,
  DATE_OF_BIRTH,
  NAME,
  TEST_TRANSACTION,
  CONTACT,
  CONTROLLER,
  JUNIOR_LICENCE,
  NO_LICENCE_REQUIRED
} from '../../../../uri.js'
import moment from 'moment'

salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))

const dobHelper = d => ({
  'date-of-birth-day': d.date().toString(),
  'date-of-birth-month': (d.month() + 1).toString(),
  'date-of-birth-year': d.year()
})

const dobAdultToday = moment().subtract(JUNIOR_MAX_AGE + 1, 'years')
const dobJuniorToday = moment().subtract(MINOR_MAX_AGE + 1, 'years')
const dobJuniorTomorrow = moment()
  .subtract(MINOR_MAX_AGE + 1, 'years')
  .add(1, 'day')
const dobSeniorToday = moment().add(-SENIOR_MIN_AGE, 'years')

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
})
beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))
afterAll(() => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_XGOV_PROPERTY
})

describe('The licence summary page', () => {
  it('redirects to the licence length page if length is set', async () => {
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('redirects to the licence type page if no licence type is set', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    // // await postRedirectGet(LICENCE_LENGTH.uri,  { 'licence-length': '12M' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TYPE.uri)
  })

  it('redirects to the licence type page if the number of rods is not set', async () => {
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TYPE.uri)
  })

  it('redirects to the licence start date if it is not set', async () => {
    await postRedirectGet(NUMBER_OF_RODS.uri, { 'number-of-rods': '2' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it('redirects to the date of birth page if it is not set', async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  it('responds with summary page if all necessary pages have been completed', async () => {
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobAdultToday))
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('continue causes a redirect to the name page', async () => {
    const data = await postRedirectGet(LICENCE_SUMMARY.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('licence type amendment causes a redirect to the summary page', async () => {
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)

    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '8D' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })
    const data2 = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data2.statusCode).toBe(200)
  })

  it('licence length amendment causes a redirect to the summary page', async () => {
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const data = await injectWithCookies('GET', LICENCE_LENGTH.uri)
    // Tests that the back-link is now set to the summary page
    expect(data.payload.search(backLinkRegEx(LICENCE_SUMMARY.uri)) > 0).toBeTruthy()
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '8D' })
    const data2 = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data2.statusCode).toBe(200)
  })

  it('licence type amendments cause an eventual redirect back to the summary page (trout and coarse)', async () => {
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    const data = await injectWithCookies('GET', LICENCE_TYPE.uri)
    expect(data.payload.search(backLinkRegEx(LICENCE_SUMMARY.uri)) > 0).toBeTruthy()
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    const data2 = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data2.statusCode).toBe(200)
    const data3 = await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })
    expect(data3.statusCode).toBe(302)
    expect(data3.headers.location).toBe(NUMBER_OF_RODS.uri)
    const data4 = await injectWithCookies('GET', NUMBER_OF_RODS.uri)
    expect(data4.payload.search(backLinkRegEx(LICENCE_SUMMARY.uri)) > 0).toBeTruthy()
    const data5 = await postRedirectGet(NUMBER_OF_RODS.uri, { 'number-of-rods': '2' })
    expect(data5.statusCode).toBe(302)
    expect(data5.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('concession (NI) amendments cause a redirect to the summary page', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    const data = await injectWithCookies('GET', BENEFIT_CHECK.uri)
    expect(data.payload.search(backLinkRegEx(LICENCE_SUMMARY.uri)) > 0).toBeTruthy()
    await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'yes' })
    await postRedirectGet(BENEFIT_NI_NUMBER.uri, { 'ni-number': '1234' })
    const data2 = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data2.statusCode).toBe(200)
  })

  it('concession (blue-badge) amendments cause a redirect to the summary page', async () => {
    await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    await postRedirectGet(BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'yes' })
    await postRedirectGet(BLUE_BADGE_NUMBER.uri, { 'blue-badge-number': '1234' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('concession (blue-badge) removal cause a redirect to the summary page', async () => {
    await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    await postRedirectGet(BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'no' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Setting the licence length to 1 day removes the disabled concession', async () => {
    await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'yes' })
    await postRedirectGet(BENEFIT_NI_NUMBER.uri, { 'ni-number': '1234' })
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].concessions.length).toBe(0)
  })

  it('number of rod amendments cause a redirect to the summary page', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await postRedirectGet(NUMBER_OF_RODS.uri, { 'number-of-rods': '2' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('unsetting the start date causes a redirect back to the summary page', async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('changing the start date causes a redirect back to the summary page', async () => {
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'another-date-or-time' })
    const fdate = moment().add(5, 'days')
    const body = {
      'licence-start-date-year': fdate.year().toString(),
      'licence-start-date-month': (fdate.month() + 1).toString(),
      'licence-start-date-day': fdate.date().toString()
    }
    await postRedirectGet(LICENCE_START_DATE.uri, body)
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('changing the start time causes an eventual redirect back to the summary page', async () => {
    await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    await postRedirectGet(BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'no' })
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })

    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'another-date-or-time' })
    const fdate = moment().add(5, 'days')
    const body = {
      'licence-start-date-year': fdate.year().toString(),
      'licence-start-date-month': (fdate.month() + 1).toString(),
      'licence-start-date-day': fdate.date().toString()
    }
    await postRedirectGet(LICENCE_START_DATE.uri, body)
    await postRedirectGet(LICENCE_START_TIME.uri, { 'licence-start-time': '14' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('changing the start time to midday causes an eventual redirect back to the summary page', async () => {
    await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'no' })
    await postRedirectGet(BLUE_BADGE_CHECK.uri, { 'blue-badge-check': 'no' })
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })

    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'another-date-or-time' })
    const fdate = moment().add(5, 'days')
    const body = {
      'licence-start-date-year': fdate.year().toString(),
      'licence-start-date-month': (fdate.month() + 1).toString(),
      'licence-start-date-day': fdate.date().toString()
    }
    await postRedirectGet(LICENCE_START_DATE.uri, body)
    await postRedirectGet(LICENCE_START_TIME.uri, { 'licence-start-time': '12' })
    const data = await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('date of birth amendment causes redirect the licence summary page', async () => {
    const data = await injectWithCookies('GET', DATE_OF_BIRTH.uri)
    expect(data.payload.search(backLinkRegEx(LICENCE_SUMMARY.uri)) > 0).toBeTruthy()
    const data2 = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobAdultToday))
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('date of birth (senior) amendment causes redirect the licence summary page and then the contact summary page', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(dobSeniorToday))
    const data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)

    const data2 = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(NAME.uri)
  })

  it('date of birth amendment (no licence required) causes a redirect to the no licence required page', async () => {
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    const data = await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobJuniorTomorrow))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NO_LICENCE_REQUIRED.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)

    const data2 = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(NAME.uri)
  })

  it('date of birth amendment (junior) causes redirect to the junior licence page and subsequent redirect to the licence summary page and then the contact summary page', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(dobJuniorToday))
    let data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(JUNIOR_LICENCE.uri)
    data = await postRedirectGet(JUNIOR_LICENCE.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)

    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)

    const data2 = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(NAME.uri)
  })

  it('date of birth amendment (junior) causes a method of contact of letter to be set no none', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(dobSeniorToday))
    await injectWithCookies('GET', CONTROLLER.uri)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.letter)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.letter)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(dobJuniorToday))
    await injectWithCookies('GET', CONTROLLER.uri)
    const { payload: payload2 } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload2).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload2).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload2).permissions[0].licenceLength).toBe('12M')
  })
})
