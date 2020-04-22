import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import mockPermits from '../../../../services/sales-api/__mocks__/data/permits.js'
import mockPermitsConcessions from '../../../../services/sales-api/__mocks__/data/permit-concessions.js'
import mockConcessions from '../../../../services/sales-api/__mocks__/data/concessions.js'
import searchResultsOne from '../../../../services/address-lookup/__mocks__/data/search-results-one'

import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'

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
  JUNIOR_LICENCE
} from '../../../../constants.js'

jest.mock('node-fetch')
const fetch = require('node-fetch')

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
  it('redirects to the date of birth page if no dob has been set', async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  it('redirects to the name page if no name has been set', async () => {
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1951'
    })
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('redirects to the address lookup page if no address has been posted', async () => {
    await injectWithCookie('POST', NAME.uri, {
      'last-name': 'Graham',
      'first-name': 'Willis'
    })
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_LOOKUP.uri)
  })

  it('redirects to the contact page if no contact details have been set', async () => {
    await injectWithCookie('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('responds with the error page if the sales API fetch fails', async () => {
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new@example.com' })
    await injectWithCookie('GET', CONTROLLER.uri)

    fetch.mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error('fetch error'))))

    const data = await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(500)
  })

  it('responds with summary page if all necessary pages have been completed', async () => {
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new2@example.com' })
    await injectWithCookie('GET', CONTROLLER.uri)

    // Mock the response from the API
    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions })))

    const data = await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('name amendments cause a redirect to the summary page', async () => {
    await injectWithCookie('POST', NAME.uri, {
      'last-name': 'James',
      'first-name': 'Bond'
    })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('address lookup amendment causes redirect the summary page', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'
    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsOne })))
    await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('GET', ADDRESS_SELECT.uri)
    await injectWithCookie('POST', ADDRESS_SELECT.uri, { address: '0' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('address entry amendment causes redirect the summary page', async () => {
    await injectWithCookie('POST', ADDRESS_ENTRY.uri, goodAddress)
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
    const data2 = await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    expect(data2.statusCode).toBe(200)
  })

  it('contact amendment (email) causes redirect the summary page', async () => {
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('newsletter amendment causes redirect the contact summary page', async () => {
    await injectWithCookie('POST', NEWSLETTER.uri, { newsletter: 'yes', email: 'example2@email.com' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('date of birth amendment causes redirect the licence summary page', async () => {
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1961'
    })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('date of birth (senior) amendment causes redirect the licence summary page and then the contact summary page', async () => {
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1921'
    })

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions })))

    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
    await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    await injectWithCookie('POST', LICENCE_SUMMARY.uri)

    const data2 = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('date of birth amendment (no licence required) causes a redirect to the no licence required page', async () => {
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '2018'
    })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NO_LICENCE_REQUIRED.uri)

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions })))

    await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    await injectWithCookie('POST', LICENCE_SUMMARY.uri)

    const data2 = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('date of birth amendment (junior) causes redirect to the junior licence page and subsequent redirect to the licence summary page and then the contact summary page', async () => {
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '2005'
    })
    let data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(JUNIOR_LICENCE.uri)
    await injectWithCookie('POST', JUNIOR_LICENCE.uri, {})
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)

    await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    await injectWithCookie('POST', LICENCE_SUMMARY.uri)

    const data2 = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('date of birth amendment (junior) causes a method of contact of letter to be set no none', async () => {
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1989'
    })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'none' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.letter)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.letter)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '2005'
    })
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload: payload2 } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload2).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload2).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload2).permissions[0].licenceLength).toBe('12M')
  })
})
