import { salesApi } from '@defra-fish/connectors-lib'
import mockPermits from '../../../../__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../../__mocks__/data/permit-concessions.js'
import mockDefraCountries from '../../../../__mocks__/data/defra-country.js'
import mockConcessions from '../../../../__mocks__/data/concessions.js'
import searchResultsOne from '../../../../services/address-lookup/__mocks__/data/search-results-one.js'

import { start, stop, initialize, injectWithCookies, postRedirectGet, backLinkRegEx } from '../../../../__mocks__/test-utils.js'

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
  LICENCE_LENGTH,
  LICENCE_TYPE
} from '../../../../uri.js'

jest.mock('node-fetch')
const fetch = require('node-fetch')

salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))
salesApi.countries.getAll = jest.fn(async () => new Promise(resolve => resolve(mockDefraCountries)))

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
    const data2 = await injectWithCookies('GET', NAME.uri)
    expect(data2.payload.search(backLinkRegEx(LICENCE_SUMMARY.uri)) > 0).toBeTruthy()
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
    const data2 = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT.uri)
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
    const data = await injectWithCookies('GET', NAME.uri)
    expect(data.payload.search(backLinkRegEx(CONTACT_SUMMARY.uri)) > 0).toBeTruthy()
    await injectWithCookies('POST', NAME.uri, {
      'last-name': 'James',
      'first-name': 'Bond'
    })
    const data2 = await injectWithCookies('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('address lookup amendment causes redirect the summary page', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'
    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsOne, ok: true })))
    const data = await injectWithCookies('GET', ADDRESS_LOOKUP.uri)
    expect(data.payload.search(backLinkRegEx(CONTACT_SUMMARY.uri)) > 0).toBeTruthy()
    await postRedirectGet(ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    await injectWithCookies('GET', ADDRESS_SELECT.uri)
    const data2 = await postRedirectGet(ADDRESS_SELECT.uri, { address: '0' })
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('address entry amendment causes redirect the summary page', async () => {
    const data = await injectWithCookies('GET', ADDRESS_ENTRY.uri)
    expect(data.payload.search(backLinkRegEx(CONTACT_SUMMARY.uri)) > 0).toBeTruthy()
    const data2 = await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
    const data3 = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data3.statusCode).toBe(200)
  })

  it('contact amendment (email) causes redirect the summary page', async () => {
    const data = await injectWithCookies('GET', CONTACT.uri)
    expect(data.payload.search(backLinkRegEx(CONTACT_SUMMARY.uri)) > 0).toBeTruthy()
    const data2 = await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('newsletter amendment causes redirect the contact summary page', async () => {
    const data = await injectWithCookies('GET', NEWSLETTER.uri)
    expect(data.payload.search(backLinkRegEx(CONTACT_SUMMARY.uri)) > 0).toBeTruthy()
    const data2 = await postRedirectGet(NEWSLETTER.uri, { newsletter: 'yes', email: 'example2@email.com' })
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })
})
