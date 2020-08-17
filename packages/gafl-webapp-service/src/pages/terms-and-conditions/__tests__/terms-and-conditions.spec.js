import moment from 'moment'

import {
  LICENCE_LENGTH,
  TERMS_AND_CONDITIONS,
  LICENCE_SUMMARY,
  CONTACT_SUMMARY,
  ADDRESS_ENTRY,
  CONTACT,
  DATE_OF_BIRTH,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NEWSLETTER,
  NAME,
  AGREED
} from '../../../uri.js'

import { start, stop, initialize, injectWithCookies, postRedirectGet, mockSalesApi } from '../../../__mocks__/test-utils-system.js'

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

const dobHelper = d => ({
  'date-of-birth-day': d.date().toString(),
  'date-of-birth-month': (d.month() + 1).toString(),
  'date-of-birth-year': d.year()
})

const dob16Today = moment().add(-16, 'years')

mockSalesApi()

describe('The terms and conditions page', () => {
  it('redirects to the licence summary if the licence summary has not been completed', async () => {
    const data = await injectWithCookies('GET', TERMS_AND_CONDITIONS.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('redirects to the contact summary page if the contact name has not been set', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dob16Today))
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_SUMMARY.uri)
    const data = await injectWithCookies('GET', TERMS_AND_CONDITIONS.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('responds with the terms and conditions page if all data is provided', async () => {
    await postRedirectGet(NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await postRedirectGet(NEWSLETTER.uri, { newsletter: 'no' })
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    await postRedirectGet(CONTACT_SUMMARY.uri)
    const data = await injectWithCookies('GET', TERMS_AND_CONDITIONS.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on invalid response', async () => {
    const data = await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'no way' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(TERMS_AND_CONDITIONS.uri)
  })

  it('sets agreed (locked) status when submitted and causes any request to redirect to the agreed handler', async () => {
    const data1 = await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(AGREED.uri)
    await injectWithCookies('GET', AGREED.uri)
    const data2 = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(AGREED.uri)
  })
})
