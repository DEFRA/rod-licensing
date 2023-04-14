import {
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  ADDRESS_ENTRY,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD,
  CONTACT,
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEWSLETTER,
  NEW_TRANSACTION,
  TEST_TRANSACTION
} from '../../../../../uri.js'

import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../../__mocks__/test-utils-system.js'
import { ADULT_TODAY, dobHelper } from '../../../../../__mocks__/test-utils-business-rules'
import { licenceToStart } from '../../../../licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../../../../licence-details/licence-type/route'
import { isPhysical } from '../../../../../processors/licence-type-display.js'
jest.mock('../../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))

mockSalesApi()

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
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
  describe('for a full 12 month licence, adult', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    })

    it('returns success on requesting', async () => {
      const response = await injectWithCookies('GET', LICENCE_FULFILMENT.uri)
      expect(response.statusCode).toBe(200)
    })

    it('redirects to licence fulfilment page on unsuccessful submission', async () => {
      const response = await injectWithCookies('POST', LICENCE_FULFILMENT.uri, {
        'licence-option': 'none'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_FULFILMENT.uri)
    })

    it('post response digital sets postalFulfilment - no, in the cache', async () => {
      await injectWithCookies('POST', LICENCE_FULFILMENT.uri, {
        'licence-option': 'digital'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.postalFulfilment).toEqual(false)
    })

    it('post response paper-licence sets postalFulfilment - yes, in the cache', async () => {
      await injectWithCookies('POST', LICENCE_FULFILMENT.uri, {
        'licence-option': 'paper-licence'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.postalFulfilment).toEqual(true)
    })
  })

  describe('for 1 day licence', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })

      isPhysical.mockReturnValueOnce(false)
    })

    it('redirects to the contact page', async () => {
      const response = await injectWithCookies('GET', LICENCE_FULFILMENT.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT.uri)
    })
  })

  describe('if the contact summary has been seen', () => {
    it('redirects to the confirmation method page', async () => {
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
      const response = await injectWithCookies('POST', LICENCE_FULFILMENT.uri, { 'licence-option': 'digital' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_CONFIRMATION_METHOD.uri)
    })
  })
})
