import { injectWithCookies, mockSalesApi } from './test-utils-system.js'
import { dobHelper, ADULT_TODAY, JUNIOR_TODAY, SENIOR_TODAY } from './test-utils-business-rules.js'

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
  DISABILITY_CONCESSION
} from '../uri.js'
import { licenceToStart } from '../pages/licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../pages/licence-details/licence-type/route'

import { disabilityConcessionTypes } from '../pages/concessions/disability/update-transaction.js'

const goodAddress = {
  premises: '14 HOWECROFT COURT',
  street: 'EASTMEAD LANE',
  locality: '',
  town: 'BRISTOL',
  postcode: 'BS9 1HJ',
  'country-code': 'GB-ENG'
}

mockSalesApi()

export const ADULT_FULL_1_DAY_LICENCE = {
  transactionResponse: {
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
          country: 'England',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Email',
          preferredMethodOfReminder: 'Email',
          email: 'new3@example.com',
          postalFulfilment: false
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
    // Initialize
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)

    // Set up the licence details
    await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)

    // Set up the contact details
    await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'no' })
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)

    // Complete the pre-payment journey
    await injectWithCookies('POST', CONTACT_SUMMARY.uri)
    await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
  }
}

export const ADULT_DISABLED_12_MONTH_LICENCE = {
  transactionResponse: {
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
          country: 'England',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Letter',
          preferredMethodOfReminder: 'Letter',
          postalFulfilment: false
        },
        issueDate: '2020-04-30T08:36:12.195Z',
        startDate: '2020-04-29T23:00:00.000Z',
        concessions: [
          {
            id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
            proof: {
              type: 'National Insurance Number',
              referenceNumber: 'QQ 12 34 56 C'
            }
          }
        ],
        referenceNumber: '01300421-1WS3FGW-YK1TTK',
        endDate: '2021-04-29T23:00:00.000Z'
      }
    ],
    cost: 82
  },
  setup: async () => {
    // Initialize
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)

    // Set up the licence details
    await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.pipDla,
      'ni-number': 'NH 34 67 44 A'
    })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)

    // Set up the contact details
    await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'no' })
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)

    // Complete the pre-payment journey
    await injectWithCookies('POST', CONTACT_SUMMARY.uri)
    await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
  }
}

export const SENIOR_12_MONTH_LICENCE = {
  transactionResponse: {
    id: 'cb913e36-a3ab-45a7-af6c-40af8befd931',
    expires: 1588411018,
    dataSource: 'Web Sales',
    permissions: [
      {
        permitId: 'dd1b34a0-0c66-e611-80dc-c4346bad0190',
        licensee: {
          birthDate: '1950-01-01',
          firstName: 'Graham',
          lastName: 'Willis',
          premises: '14 Howecroft Court',
          street: 'Eastmead Lane',
          town: 'Bristol',
          postcode: 'BS9 1HJ',
          country: 'England',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Letter',
          preferredMethodOfReminder: 'Letter',
          postalFulfilment: false
        },
        issueDate: '2020-04-30T09:16:58.635Z',
        startDate: '2020-04-29T23:00:00.000Z',
        concessions: [
          {
            id: 'd0ece997-ef65-e611-80dc-c4346bad4004',
            proof: {
              type: 'No proof'
            }
          }
        ],
        referenceNumber: '01300420-1WS0SGW-78CGFU',
        endDate: '2020-04-29T23:00:00.000Z'
      }
    ],
    cost: 54
  },
  setup: async () => {
    // Initialize
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)

    // Set up the licence details
    await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(SENIOR_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)

    // Set up the contact details
    await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'no' })
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)

    // Complete the pre-payment journey
    await injectWithCookies('POST', CONTACT_SUMMARY.uri)
    await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
  }
}

export const JUNIOR_LICENCE = {
  transactionResponse: {
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
          country: 'England',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Prefer not to be contacted',
          preferredMethodOfReminder: 'Prefer not to be contacted',
          postalFulfilment: false
        },
        issueDate: '2020-04-30T09:35:28.014Z',
        startDate: '2020-04-29T23:00:00.000Z',
        concessions: [
          {
            id: '3230c68f-ef65-e611-80dc-c4346bad4004',
            proof: {
              type: 'No proof'
            }
          }
        ],
        referenceNumber: '01300420-1WS0JGW-FLNA84',
        endDate: '2020-04-29T23:00:00.000Z'
      }
    ],
    cost: 0
  },
  setup: async () => {
    // Initialize
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)

    // Set up the licence details
    await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)

    // Set up the contact details
    await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'no' })
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)

    // Complete the pre-payment journey
    await injectWithCookies('POST', CONTACT_SUMMARY.uri)
    await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
  }
}

export const JUNIOR_DISABLED_LICENCE = {
  transactionResponse: {
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
          country: 'England',
          preferredMethodOfNewsletter: 'Prefer not to be contacted',
          preferredMethodOfConfirmation: 'Prefer not to be contacted',
          preferredMethodOfReminder: 'Prefer not to be contacted',
          postalFulfilment: false
        },
        issueDate: '2020-04-30T09:35:28.014Z',
        startDate: '2020-04-29T23:00:00.000Z',
        concessions: [
          {
            id: 'd1ece997-ef65-e611-80dc-c4346bad4004',
            proof: {
              type: 'National Insurance Number',
              referenceNumber: 'NH 34 67 44 A'
            }
          }
        ],
        referenceNumber: '01300420-1WS0JGW-FLNA84',
        endDate: '2020-04-29T23:00:00.000Z'
      }
    ],
    cost: 0
  },
  setup: async () => {
    // Initialize
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    await injectWithCookies('GET', CONTROLLER.uri)

    // Set up the licence details
    await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
    await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    await injectWithCookies('POST', DISABILITY_CONCESSION.uri, {
      'disability-concession': disabilityConcessionTypes.pipDla,
      'ni-number': 'NH 34 67 44 A'
    })
    await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    await injectWithCookies('GET', LICENCE_SUMMARY.uri)

    // Set up the contact details
    await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
    await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'no' })
    await injectWithCookies('GET', CONTACT_SUMMARY.uri)

    // Complete the pre-payment journey
    await injectWithCookies('POST', CONTACT_SUMMARY.uri)
    await injectWithCookies('POST', TERMS_AND_CONDITIONS.uri, { agree: 'yes' })
  }
}

export const MOCK_PAYMENT_RESPONSE = {
  state: { status: 'created', finished: false },
  payment_id: 'qdq15eu98cpk8bc14qs9ht0t3v',
  payment_provider: 'sandbox',
  created_date: '2020-05-05T07:30:56.214Z',
  _links: {
    next_url: {
      href: 'https://www.payments.service.gov.uk/secure/017f99a4-977d-40c2-8a2f-fb0f995a88f0',
      method: 'GET'
    },
    self: {
      href: 'https://publicapi.payments.service.gov.uk/v1/payments/qdq15eu98cpk8bc14qs9ht0t3v',
      method: 'GET'
    }
  }
}

export const MOCK_RECURRING_PAYMENT_RESPONSE = {
  state: { status: 'created', finished: false },
  reference: 'transaction-id',
  description: 'recurring card payments',
  user_identifier: 'permission-id'
}
