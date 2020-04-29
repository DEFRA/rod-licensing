import { injectWithCookie, postRedirectGet } from './test-utils'
import moment from 'moment'
import mockPermits from '../services/sales-api/__mocks__/data/permits'
import mockPermitsConcessions from '../services/sales-api/__mocks__/data/permit-concessions'
import mockConcessions from '../services/sales-api/__mocks__/data/concessions'

import {
  ADDRESS_ENTRY,
  CONTACT,
  CONTACT_SUMMARY,
  CONTROLLER,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEW_TRANSACTION,
  NEWSLETTER,
  TERMS_AND_CONDITIONS
} from '../constants.js'

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
// const dob16Tomorrow = moment().add(-16, 'years').add(1, 'day')

jest.mock('node-fetch')
const fetch = require('node-fetch')

const MOCK_CONCESSIONS = [
  {
    id: '3230c68f-ef65-e611-80dc-c4346bad4004',
    name: 'Junior'
  },
  {
    id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
    name: 'Senior'
  },
  {
    id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
    name: 'Disabled'
  }
]

const ADULT_FULL_1_DAY_LICENCE = {
  transActionResponse: {
    id: 'ad28f2b3-2ab3-4d45-abc7-ae62c4da7944',
    expires: 1588342308,
    dataSource: 'Web Sales',
    permissions: [
      {
        permitId: 'a51b34a0-0c66-e611-80dc-c4346bad0190',
        licensee: {
          birthDate: '1970-01-01',
          firstName: 'Graham',
          lastName: 'Willis',
          premises: '14 Howecroft Court',
          street: 'Eastmead Lane',
          town: 'Bristol',
          postcode: 'BS9 1HJ',
          country: 'United Kingdom',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Email',
          preferredMethodOfReminder: 'Email',
          email: 'new3@example.com'
        },
        issueDate: '2020-04-29T14:11:47.855Z',
        startDate: '2020-04-28T23:00:00.000Z',
        referenceNumber: '01300420-1WS1FGW-B2F11U',
        endDate: '2020-04-29T23:00:00.000Z'
      }
    ],
    cost: 12
  },
  finalisationResponse: {
    payment: {
      amount: 12,
      timestamp: '2020-04-29T14:11:48.604Z',
      source: 'Gov Pay',
      method: 'Other'
    }
  },
  setup: async () => {
    await injectWithCookie('GET', NEW_TRANSACTION.uri)
    await injectWithCookie('GET', CONTROLLER.uri)
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dob16Today))

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions, ok: true })))

    await injectWithCookie('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_SUMMARY.uri)
    await postRedirectGet(NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await postRedirectGet(NEWSLETTER.uri, { newsletter: 'no' })
    await injectWithCookie('GET', CONTACT_SUMMARY.uri)
    await postRedirectGet(CONTACT_SUMMARY.uri)
    await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })

    fetch.mockReset()
  }
}

export { MOCK_CONCESSIONS, ADULT_FULL_1_DAY_LICENCE }
