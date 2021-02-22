import {
  ADDRESS_ENTRY,
  LICENCE_FULFILMENT,
  CONTACT,
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEWSLETTER
} from '../../../../../uri.js'

import { start, stop, initialize, injectWithCookies } from '../../../../../__mocks__/test-utils-system.js'
import { licenceToStart } from '../../../../licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../../../../licence-details/licence-type/route'

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

describe('The licence fulfilment page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', LICENCE_FULFILMENT.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects to contact page on successful submission', async () => {
    const response = await injectWithCookies('POST', LICENCE_FULFILMENT.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(CONTACT.uri)
  })

  it('redirects to the summary page if the summary page is seen', async () => {
    // Set up the licence details
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)

    // Set up the contact details
    await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'yes', 'email-entry': 'no' })

    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    const response = await injectWithCookies('POST', LICENCE_FULFILMENT.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
  })
})
