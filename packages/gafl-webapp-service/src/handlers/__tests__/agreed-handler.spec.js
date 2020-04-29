import { initialize, injectWithCookie, postRedirectGet, start, stop } from '../../__mocks__/test-utils'
import moment from 'moment'
import mockPermits from '../../services/sales-api/__mocks__/data/permits'
import mockPermitsConcessions from '../../services/sales-api/__mocks__/data/permit-concessions'
import mockConcessions from '../../services/sales-api/__mocks__/data/concessions'

import {
  CONTROLLER,
  NEW_TRANSACTION,
  ADDRESS_ENTRY,
  CONTACT,
  CONTACT_SUMMARY,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEWSLETTER,
  AGREED
} from '../../constants.js'

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

const dobHelper = d => ({
  'date-of-birth-day': d.date().toString(),
  'date-of-birth-month': (d.month() + 1).toString(),
  'date-of-birth-year': d.year()
})

const dob16Today = moment().add(-16, 'years')

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The agreed handler', () => {
  beforeEach(async () => {
    await injectWithCookie('GET', NEW_TRANSACTION.uri)
    await injectWithCookie('GET', CONTROLLER.uri)
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dob16Today))

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions })))

    await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_SUMMARY.uri)
    await postRedirectGet(NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await postRedirectGet(NEWSLETTER.uri, { newsletter: 'no' })
    await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    await postRedirectGet(CONTACT_SUMMARY.uri)
    // await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
  })

  it('if the agreed handler is not set throw a status 403 (forbidden) exception', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(403)
  })
})
