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
  AGREED,
  NEW_TRANSACTION
} from '../../../uri.js'

import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../__mocks__/test-utils-system.js'
import { dobHelper, ADULT_TODAY } from '../../../__mocks__/test-utils-business-rules.js'
import { licenceToStart } from '../../licence-details/licence-to-start/update-transaction.js'
import { licenseTypes } from '../../licence-details/licence-type/route.js'

beforeAll(() => {
  process.env.ANALYTICS_PRIMARY_PROPERTY = 'GJDJKDKFJ'
  process.env.ANALYTICS_PROPERTY_API = 'XHHDjknw-sadcC'
})
beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => {
  delete process.env.ANALYTICS_PRIMARY_PROPERTY
  delete process.env.ANALYTICS_PROPERTY_API
  stop(d)
})

const goodAddress = {
  premises: '14 HOWECROFT COURT',
  street: 'EASTMEAD LANE',
  locality: '',
  town: 'BRISTOL',
  postcode: 'BS9 1HJ',
  'country-code': 'GB'
}

mockSalesApi()

describe('The terms and conditions page', () => {
  beforeEach(jest.clearAllMocks)

  it('redirects to the licence summary if the licence summary has not been completed', async () => {
    const data = await injectWithCookies('GET', TERMS_AND_CONDITIONS.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('redirects to the contact summary page if the contact page has not been visited', async () => {
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)
    const data = await injectWithCookies('GET', TERMS_AND_CONDITIONS.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('redirects back to itself on invalid response', async () => {
    const data = await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'no way' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(TERMS_AND_CONDITIONS.uri)
  })

  it('responds with the terms and conditions page if all data is provided', async () => {
    await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)

    await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'no', 'email-entry': 'no' })
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    await injectWithCookies('POST', CONTACT_SUMMARY.uri)
    const data = await injectWithCookies('GET', TERMS_AND_CONDITIONS.uri)
    expect(data.statusCode).toBe(200)
  })

  it('sets agreed (locked) status when submitted and causes any request to redirect to the agreed handler', async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    const data1 = await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
    expect(data1.statusCode).toBe(302)
    expect(data1.headers.location).toBe(AGREED.uri)
    await injectWithCookies('GET', AGREED.uri) // generates dirty great error
    const data2 = await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    expect(data2.statusCode).toBe(302)
    expect(data2.headers.location).toBe(AGREED.uri)
  })
})
