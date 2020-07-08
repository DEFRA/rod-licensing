import {
  IDENTIFY,
  AUTHENTICATE,
  CONTROLLER,
  RENEWAL_START_DATE,
  RENEWAL_START_VALIDATE,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  CONTACT_SUMMARY,
  TEST_TRANSACTION
} from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { JUNIOR_MAX_AGE, ADVANCED_PURCHASE_MAX_DAYS } from '@defra-fish/business-rules-lib'
import { authenticationResult } from '../../identify/__mocks__/data/authentication-result.js'
import moment from 'moment'
import mockPermits from '../../../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../../__mocks__/data/permit-concessions.js'
import mockConcessions from '../../../../__mocks__/data/concessions.js'

const OLD_ENV = process.env
beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'UA-123456789-0'
  process.env.ANALYTICS_XGOV_PROPERTY = 'UA-987654321-0'
})
beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))
afterAll(() => { process.env = OLD_ENV })

const VALID_IDENTIFY = IDENTIFY.uri.replace('{referenceNumber}', 'AAAAAA')

const dobAdultToday = moment().subtract(JUNIOR_MAX_AGE + 1, 'years')
const dobHelper = d => ({
  'date-of-birth-day': d.date().toString(),
  'date-of-birth-month': (d.month() + 1).toString(),
  'date-of-birth-year': d.year()
})

jest.mock('@defra-fish/connectors-lib')
salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))

describe('The easy renewal, change start date page', () => {
  beforeEach(async () => {
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(authenticationResult)))
    await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobAdultToday)))
    await injectWithCookies('GET', AUTHENTICATE.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
  })
  it('displays the page when requested', async () => {
    const data = await injectWithCookies('GET', RENEWAL_START_DATE.uri)
    expect(data.statusCode).toBe(200)
  })
  it('redirects to a page when requesting an invalid start date', async () => {
    await injectWithCookies('GET', RENEWAL_START_DATE.uri)
    const data = await injectWithCookies('POST', RENEWAL_START_DATE.uri, {
      'licence-start-date-year': '100',
      'licence-start-date-month': '100',
      'licence-start-date-day': '100'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_START_DATE.uri)
  })

  it(`redirects back to the start date page when requesting an start date ${ADVANCED_PURCHASE_MAX_DAYS} days after the renewal date`, async () => {
    await injectWithCookies('GET', RENEWAL_START_DATE.uri)

    const renewDate = moment(authenticationResult.permission.endDate).add(ADVANCED_PURCHASE_MAX_DAYS + 1, 'days')
    const data = await injectWithCookies('POST', RENEWAL_START_DATE.uri, {
      'licence-start-date-year': renewDate.year().toString(),
      'licence-start-date-month': (renewDate.month() + 1).toString(),
      'licence-start-date-day': renewDate.date().toString()
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_START_VALIDATE.uri)
    const data2 = await injectWithCookies('GET', RENEWAL_START_VALIDATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(RENEWAL_START_DATE.uri)
  })

  it('redirects back to the start date page when requesting an start date in the past', async () => {
    await injectWithCookies('GET', RENEWAL_START_DATE.uri)
    const renewDate = moment().add(-1, 'days')
    const data = await injectWithCookies('POST', RENEWAL_START_DATE.uri, {
      'licence-start-date-year': renewDate.year().toString(),
      'licence-start-date-month': (renewDate.month() + 1).toString(),
      'licence-start-date-day': renewDate.date().toString()
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_START_DATE.uri)
  })

  it('redirects back to the licence summary date page when requesting an start date in the allowed range', async () => {
    await injectWithCookies('GET', RENEWAL_START_DATE.uri)
    const renewDate = moment(authenticationResult.permission.endDate).add(5, 'days')
    await injectWithCookies('POST', RENEWAL_START_DATE.uri, {
      'licence-start-date-year': renewDate.year().toString(),
      'licence-start-date-month': (renewDate.month() + 1).toString(),
      'licence-start-date-day': renewDate.date().toString()
    })
    const data2 = await injectWithCookies('GET', RENEWAL_START_VALIDATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceStartDate).toBe(renewDate.format('YYYY-MM-DD'))
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const data3 = await postRedirectGet(LICENCE_SUMMARY.uri, {})
    expect(data3.statusCode).toBe(302)
    expect(data3.headers.location).toBe(CONTACT_SUMMARY.uri)
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
  })

  it('allows start date immediately after payment if the licence has expired', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.renewedEndDate = newAuthenticationResult.permission.endDate = moment()
      .add(-5, 'days')
      .format('YYYY-MM-DD')
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult)))
    await injectWithCookies('POST', VALID_IDENTIFY, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobAdultToday)))
    await injectWithCookies('GET', AUTHENTICATE.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await injectWithCookies('GET', LICENCE_TO_START.uri)
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceStartDate).toBe(moment().format('YYYY-MM-DD'))
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const data2 = await postRedirectGet(LICENCE_SUMMARY.uri, {})
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
  })

  it('redirects back from the licence summary to the contact summary page for a continuation', async () => {
    const renewDate = moment(authenticationResult.permission.endDate)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licenceStartDate).toBe(renewDate.format('YYYY-MM-DD'))
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const data = await postRedirectGet(LICENCE_SUMMARY.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
  })
})
