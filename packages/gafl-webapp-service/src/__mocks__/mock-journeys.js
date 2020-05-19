import { injectWithCookies, postRedirectGet } from './test-utils'
import moment from 'moment'
import mockPermits from '../services/sales-api/__mocks__/data/permits'
import mockPermitsConcessions from '../services/sales-api/__mocks__/data/permit-concessions'
import mockConcessions from '../services/sales-api/__mocks__/data/concessions'
import mockDefraCountries from '../services/address-lookup/__mocks__/data/defra-country'

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
  TERMS_AND_CONDITIONS,
  BENEFIT_CHECK,
  BENEFIT_NI_NUMBER
} from '../uri.js'

import { JUNIOR_MAX_AGE, MINOR_MAX_AGE, SENIOR_MIN_AGE } from '@defra-fish/business-rules-lib'

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

const dobJuniorToday = moment().subtract(MINOR_MAX_AGE + 1, 'years')
const dobAdultToday = moment().subtract(JUNIOR_MAX_AGE + 1, 'years')
const dobSeniorToday = moment().add(-SENIOR_MIN_AGE, 'years')

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
  setup: async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobAdultToday))

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions, ok: true })))

    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_SUMMARY.uri)
    await postRedirectGet(NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await postRedirectGet(NEWSLETTER.uri, { newsletter: 'no' })

    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockDefraCountries, ok: true })))
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    await postRedirectGet(CONTACT_SUMMARY.uri)
    await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })

    fetch.mockReset()
  }
}

const ADULT_DISABLED_12_MONTH_LICENCE = {
  transActionResponse: {
    id: '50c26295-013f-48c0-b354-f22544254fab',
    expires: 1588408572,
    dataSource: 'Web Sales',
    permissions: [
      {
        permitId: 'db1b34a0-0c66-e611-80dc-c4346bad0190',
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
          preferredMethodOfConfirmation: 'Letter',
          preferredMethodOfReminder: 'Letter'
        },
        issueDate: '2020-04-30T08:36:12.195Z',
        startDate: '2020-04-29T23:00:00.000Z',
        concession: {
          concessionId: 'd1ece997-ef65-e611-80dc-c4346bad4004',
          proof: {
            type: 'National Insurance Number',
            referenceNumber: 'QQ 12 34 56 C'
          }
        },
        referenceNumber: '01300421-1WS3FGW-YK1TTK',
        endDate: '2021-04-29T23:00:00.000Z'
      }
    ],
    cost: 82
  },
  setup: async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobAdultToday))
    await postRedirectGet(BENEFIT_CHECK.uri, { 'benefit-check': 'yes' })
    await postRedirectGet(BENEFIT_NI_NUMBER.uri, { 'ni-number': 'NH436677A' })

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions, ok: true })))

    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_SUMMARY.uri)
    await postRedirectGet(NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none' })

    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockDefraCountries, ok: true })))
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    await postRedirectGet(CONTACT_SUMMARY.uri)
    await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })

    fetch.mockReset()
  }
}

const SENIOR_12_MONTH_LICENCE = {
  transActionResponse: {
    id: 'cb913e36-a3ab-45a7-af6c-40af8befd931',
    expires: 1588411018,
    dataSource: 'Web Sales',
    permissions: [
      {
        permitId: 'dd1b34a0-0c66-e611-80dc-c4346bad0190',
        licensee: {
          birthDate: '1955-04-30',
          firstName: 'Graham',
          lastName: 'Willis',
          premises: '14 Howecroft Court',
          street: 'Eastmead Lane',
          town: 'Bristol',
          postcode: 'BS9 1HJ',
          country: 'United Kingdom',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Letter',
          preferredMethodOfReminder: 'Letter'
        },
        issueDate: '2020-04-30T09:16:58.635Z',
        startDate: '2020-04-29T23:00:00.000Z',
        concession: {
          concessionId: 'd0ece997-ef65-e611-80dc-c4346bad4004',
          proof: {
            type: 'No proof'
          }
        },
        referenceNumber: '01300420-1WS0SGW-78CGFU',
        endDate: '2020-04-29T23:00:00.000Z'
      }
    ],
    cost: 54
  },
  setup: async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobSeniorToday))

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions, ok: true })))

    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_SUMMARY.uri)
    await postRedirectGet(NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none' })

    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockDefraCountries, ok: true })))
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    await postRedirectGet(CONTACT_SUMMARY.uri)
    await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })

    fetch.mockReset()
  }
}

const JUNIOR_12_MONTH_LICENCE = {
  transActionResponse: {
    id: '8793ff10-6372-4e9c-b4f8-d0cde0ed2277',
    expires: 1588412128,
    dataSource: 'Web Sales',
    permissions: [
      {
        permitId: 'd91b34a0-0c66-e611-80dc-c4346bad0190',
        licensee: {
          birthDate: '2006-01-01',
          firstName: 'Graham',
          lastName: 'Willis',
          premises: '14 Howecroft Court',
          street: 'Eastmead Lane',
          town: 'Bristol',
          postcode: 'BS9 1HJ',
          country: 'United Kingdom',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Prefer not to be contacted',
          preferredMethodOfReminder: 'Prefer not to be contacted'
        },
        issueDate: '2020-04-30T09:35:28.014Z',
        startDate: '2020-04-29T23:00:00.000Z',
        concession: {
          concessionId: '3230c68f-ef65-e611-80dc-c4346bad4004',
          proof: {
            type: 'No proof'
          }
        },
        referenceNumber: '01300420-1WS0JGW-FLNA84',
        endDate: '2020-04-29T23:00:00.000Z'
      }
    ],
    cost: 0
  },
  setup: async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': 'salmon-and-sea-trout' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(dobJuniorToday))

    fetch
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermits, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockPermitsConcessions, ok: true })))
      .mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockConcessions, ok: true })))

    await injectWithCookies('GET', LICENCE_SUMMARY.uri)
    await postRedirectGet(LICENCE_SUMMARY.uri)
    await postRedirectGet(NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await postRedirectGet(ADDRESS_ENTRY.uri, goodAddress)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none' })

    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => mockDefraCountries, ok: true })))
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    await postRedirectGet(CONTACT_SUMMARY.uri)
    await postRedirectGet(TERMS_AND_CONDITIONS.uri, { agree: 'yes' })

    fetch.mockReset()
  }
}

export { MOCK_CONCESSIONS, ADULT_FULL_1_DAY_LICENCE, ADULT_DISABLED_12_MONTH_LICENCE, SENIOR_12_MONTH_LICENCE, JUNIOR_12_MONTH_LICENCE }
