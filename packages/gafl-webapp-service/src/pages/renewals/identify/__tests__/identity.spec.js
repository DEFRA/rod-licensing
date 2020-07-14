import { IDENTIFY, AUTHENTICATE, CONTROLLER, LICENCE_SUMMARY, TEST_TRANSACTION, RENEWAL_PUBLIC, RENEWAL_INACTIVE } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { JUNIOR_MAX_AGE, RENEW_AFTER_DAYS, RENEW_BEFORE_DAYS } from '@defra-fish/business-rules-lib'
import { authenticationResult } from '../__mocks__/data/authentication-result.js'
import moment from 'moment'
import * as constants from '../../../../processors/mapping-constants.js'
import { hasSenior } from '../../../../processors/concession-helper.js'
import { LICENCE_LENGTH } from '../../../../../../../../../rod-licensing/packages/gafl-webapp-service/src/uri'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const VALID_RENEWAL_PUBLIC = RENEWAL_PUBLIC.uri.replace('{referenceNumber?}', 'AAAAAA')
const VALID_RENEWAL_PUBLIC_URI = RENEWAL_PUBLIC.uri.replace('{referenceNumber?}', '')

const dobAdultToday = moment().subtract(JUNIOR_MAX_AGE + 1, 'years')
const dobInvalid = moment().add(1, 'years')
const dobHelper = d => ({
  'date-of-birth-day': d.date().toString(),
  'date-of-birth-month': (d.month() + 1).toString(),
  'date-of-birth-year': d.year()
})

jest.mock('@defra-fish/connectors-lib')

describe('The easy renewal identification page', () => {
  it('returns a failure when called with an invalid permission reference ', async () => {
    const data = await injectWithCookies('GET', RENEWAL_PUBLIC.uri.replace('{referenceNumber}', 'not-a-valid-reference-number'))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri)
    const data2 = await injectWithCookies('GET', IDENTIFY.uri)
    expect(data2.statusCode).toBe(403)
  })

  it('returns successfully when called with a valid reference ', async () => {
    const data = await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri)
    const data2 = await injectWithCookies('GET', IDENTIFY.uri)
    expect(data2.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an invalid postcode', async () => {
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'HHHHH' }, dobHelper(dobAdultToday)))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri)
  })

  it('redirects back to itself on posting an invalid data of birth', async () => {
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies('POST', IDENTIFY.uri, Object.assign({ postcode: 'BS9 1HJ' }, dobHelper(dobInvalid)))
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(IDENTIFY.uri)
  })

  it('redirects back to itself on posting an valid but not authenticated details', async () => {
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(null)))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC_URI)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(dobAdultToday))
    )
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(AUTHENTICATE.uri)
    const data2 = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(IDENTIFY.uri)
    const data3 = await injectWithCookies('GET', IDENTIFY.uri)
    expect(data3.statusCode).toBe(200)
  })

  it.each([
    ['email', constants.HOW_CONTACTED.email],
    ['text', constants.HOW_CONTACTED.text],
    ['none', constants.HOW_CONTACTED.none],
    ['letter', constants.HOW_CONTACTED.letter]
  ])('redirects to the controller on posting a valid response - (how contacted=%s)', async (name, fn) => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.licensee.preferredMethodOfConfirmation.label = fn
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .toISOString()
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult)))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    const data = await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(dobAdultToday))
    )
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(AUTHENTICATE.uri)
    const data2 = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTROLLER.uri)
  })

  it('that an adult licence holder who is now over 65 gets a senior concession', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .toISOString()
    newAuthenticationResult.permission.licensee.birthDate = moment()
      .add(-65, 'years')
      .add(-1, 'days')
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult)))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(dobAdultToday))
    )
    await injectWithCookies('GET', AUTHENTICATE.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(hasSenior(JSON.parse(payload).permissions[0])).toBeTruthy()
  })

  it('that an expiry to far in the future causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .add(RENEW_BEFORE_DAYS + 1, 'days')
      .toISOString()
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult)))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(dobAdultToday))
    )
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_INACTIVE.uri)

    // Fetch the page
    const data2 = await injectWithCookies('GET', RENEWAL_INACTIVE.uri)
    expect(data2.statusCode).toBe(200)

    const data3 = await postRedirectGet(RENEWAL_INACTIVE.uri, {})
    expect(data3.statusCode).toBe(302)
    expect(data3.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('that an expiry that has expired causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.endDate = moment()
      .startOf('day')
      .add(-1 * (RENEW_AFTER_DAYS + 1), 'days')
      .toISOString()
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult)))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(dobAdultToday))
    )
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_INACTIVE.uri)
  })

  it('that an expiry for a 1 or 8 day licence causes a redirect to the invalid renewal page', async () => {
    const newAuthenticationResult = Object.assign({}, authenticationResult)
    newAuthenticationResult.permission.permit.durationMagnitude = 1
    newAuthenticationResult.permission.permit.durationDesignator.description = 'D'
    salesApi.authenticate = jest.fn(async () => new Promise(resolve => resolve(newAuthenticationResult)))
    await injectWithCookies('GET', VALID_RENEWAL_PUBLIC)
    await injectWithCookies('GET', IDENTIFY.uri)
    await injectWithCookies(
      'POST',
      IDENTIFY.uri,
      Object.assign({ postcode: 'BS9 1HJ', referenceNumber: 'AAAAAA' }, dobHelper(dobAdultToday))
    )
    const data = await injectWithCookies('GET', AUTHENTICATE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(RENEWAL_INACTIVE.uri)
  })
})
