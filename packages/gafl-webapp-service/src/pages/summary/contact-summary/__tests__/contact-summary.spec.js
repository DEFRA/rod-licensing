import { salesApi } from '@defra-fish/connectors-lib'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import mockPermits from '../../../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../../__mocks__/data/permit-concessions.js'
import mockDefraCountries from '../../../../__mocks__/data/defra-country.js'
import mockConcessions from '../../../../__mocks__/data/concessions.js'
import searchResultsOne from '../../../../services/address-lookup/__mocks__/data/search-results-one'

import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

import {
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  NAME,
  CONTROLLER,
  ADDRESS_ENTRY,
  ADDRESS_LOOKUP,
  ADDRESS_SELECT,
  CONTACT,
  LICENCE_TO_START,
  DATE_OF_BIRTH,
  NEWSLETTER,
  NO_LICENCE_REQUIRED,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  JUNIOR_LICENCE,
  TEST_TRANSACTION
} from '../../../../uri.js'

jest.mock('node-fetch')
const fetch = require('node-fetch')

salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))
salesApi.countries.getAll = jest.fn(async () => new Promise(resolve => resolve(mockDefraCountries)))

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const goodAddress = {
  premises: '14 HOWECROFT COURT',
  street: 'EASTMEAD LANE',
  locality: '',
  town: 'BRISTOL',
  postcode: 'BS9 1HJ',
  'country-code': 'GB'
}

describe('The contact summary page', () => {
  it('redirects to the licence summary if the licence summary has not been completed', async () => {
    const data = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('redirects to the date of birth page if no dob has been set', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1951'
    })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_SUMMARY.uri)
    const data = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('redirects to the name page if no name has been set', async () => {
    await injectWithCookies('GET', CONTROLLER.uri)
    const data = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('redirects to the address lookup page if no address has been posted', async () => {
    await injectWithCookies('POST', NAME.uri, {
      'last-name': 'Graham',
      'first-name': 'Willis'
    })
    await injectWithCookies('GET', CONTROLLER.uri)
    const data = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_LOOKUP.uri)
  })

  it('redirects to the contact page if no contact details have been set', async () => {
    await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    const data = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('responds with the error page if the sales API fetch fails', async () => {
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'new2@example.com' })
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '8D' })
    salesApi.permits.getAll.mockClear()
    salesApi.permits.getAll = jest.fn(async () => new Promise((resolve, reject) => reject(new Error('fetch error'))))
    const data = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(500)
    salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
  })

  it('responds with summary page if all necessary pages have been completed', async () => {
    const data = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('name amendments cause a redirect to the summary page', async () => {
    await injectWithCookies('POST', NAME.uri, {
      'last-name': 'James',
      'first-name': 'Bond'
    })
    const data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('address lookup amendment causes redirect the summary page', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'
    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsOne, ok: true })))
    await postRedirectGet(ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    await injectWithCookies('GET', ADDRESS_SELECT.uri)
    const data = await postRedirectGet(ADDRESS_SELECT.uri, { address: '0' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('address entry amendment causes redirect the summary page', async () => {
    const data = await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
    const data2 = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data2.statusCode).toBe(200)
  })

  it('contact amendment (email) causes redirect the summary page', async () => {
    const data = await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('newsletter amendment causes redirect the contact summary page', async () => {
    const data = await postRedirectGet(NEWSLETTER.uri, { newsletter: 'yes', email: 'example2@email.com' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('date of birth amendment causes redirect the licence summary page', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1961'
    })
    const data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('date of birth (senior) amendment causes redirect the licence summary page and then the contact summary page', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1921'
    })
    const data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)

    const data2 = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('date of birth amendment (no licence required) causes a redirect to the no licence required page', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '2018'
    })
    const data = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NO_LICENCE_REQUIRED.uri)
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)

    const data2 = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('date of birth amendment (junior) causes redirect to the junior licence page and subsequent redirect to the licence summary page and then the contact summary page', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '2005'
    })
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
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('date of birth amendment (junior) causes a method of contact of letter to be set no none', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1989'
    })
    await injectWithCookies('GET', CONTROLLER.uri)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.letter)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.letter)
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '2005'
    })
    await injectWithCookies('GET', CONTROLLER.uri)
    const { payload: payload2 } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload2).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload2).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload2).permissions[0].licenceLength).toBe('12M')
  })
})
