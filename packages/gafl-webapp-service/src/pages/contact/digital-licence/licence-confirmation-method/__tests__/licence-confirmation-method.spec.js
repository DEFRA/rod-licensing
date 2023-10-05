import {
  LICENCE_LENGTH,
  DATE_OF_BIRTH,
  ADDRESS_ENTRY,
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

import { HOW_CONTACTED } from '../../../../../processors/mapping-constants.js'
import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../../../../__mocks__/test-utils-system.js'
import { ADULT_TODAY, dobHelper } from '../../../../../__mocks__/test-utils-business-rules'
import { licenceToStart } from '../../../../licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../../../../licence-details/licence-type/route'
import { isPhysical } from '../../../../../processors/licence-type-display.js'
jest.mock('../../../../../processors/licence-type-display.js')

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

describe('The licence confirmation method page', () => {
  describe('for a full 12 month licence, adult', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      isPhysical.mockReturnValueOnce(true)
    })

    it('return the page on request', async () => {
      const response = await injectWithCookies('GET', LICENCE_CONFIRMATION_METHOD.uri)
      expect(response.statusCode).toBe(200)
    })

    it('redirects to itself on an empty response', async () => {
      const response = await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, {})
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(LICENCE_CONFIRMATION_METHOD.uri)
    })

    it('redirects to itself on an invalid contact method', async () => {
      const response = await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, { 'licence-confirmation-method': 'skype' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(LICENCE_CONFIRMATION_METHOD.uri)
    })

    it('redirects to itself on an empty email', async () => {
      const response = await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, {
        'licence-confirmation-method': 'email',
        email: ''
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(LICENCE_CONFIRMATION_METHOD.uri)
    })

    it('redirects to itself on an invalid email', async () => {
      const response = await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, {
        'licence-confirmation-method': 'email',
        email: 'foo'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(LICENCE_CONFIRMATION_METHOD.uri)
    })

    it('redirects to itself on an empty mobile number', async () => {
      const response = await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, { 'licence-confirmation-method': 'text', text: '' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(LICENCE_CONFIRMATION_METHOD.uri)
    })

    it.each(['+44(0)7513438168', '923246734', 'email@com', '01179835413', '+457513 438 167'])(
      'redirects to itself on an invalid mobile number: %s',
      async mobileNumber => {
        const response = await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, {
          'licence-confirmation-method': 'text',
          text: mobileNumber
        })
        expect(response.statusCode).toBe(302)
        expect(response.headers.location).toHaveValidPathFor(LICENCE_CONFIRMATION_METHOD.uri)
      }
    )

    it('post response email sets licence-confirmation-method - email, in the cache', async () => {
      await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, {
        'licence-confirmation-method': 'email',
        email: 'example@email.com'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.email)
      expect(JSON.parse(payload).permissions[0].licensee.email).toEqual('example@email.com')
    })

    it.each([
      ['07513438122', '07513438122'],
      ['07513 438167', '07513438167'],
      ['07513 438 167', '07513438167'],
      ['+447513 438 167', '+447513438167'],
      ['+44 7513 438 167', '+447513438167'],
      ['07513438168', '07513438168']
    ])(
      'post response text sets licence-confirmation-method - text in the cache for mobile number %s',
      async (mobileNumberi, mobileNumbero) => {
        await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, { 'licence-confirmation-method': 'text', text: mobileNumberi })
        const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
        expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.text)
        expect(JSON.parse(payload).permissions[0].licensee.mobilePhone).toEqual(mobileNumbero)
      }
    )
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
      const response = await injectWithCookies('GET', LICENCE_CONFIRMATION_METHOD.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(CONTACT.uri)
    })
  })

  describe('if the contact summary has been seen', () => {
    it('controller redirects to the contact page', async () => {
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
      const response = await injectWithCookies('POST', LICENCE_CONFIRMATION_METHOD.uri, {
        'licence-confirmation-method': 'email',
        email: 'example@email.com'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toHaveValidPathFor(CONTACT.uri)
    })
  })
})
