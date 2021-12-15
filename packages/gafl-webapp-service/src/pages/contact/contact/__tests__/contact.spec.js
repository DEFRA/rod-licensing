import {
  CONTACT,
  LICENCE_FOR,
  LICENCE_LENGTH,
  CONTROLLER,
  DATE_OF_BIRTH,
  LICENCE_TO_START,
  CONTACT_SUMMARY,
  NEWSLETTER,
  TEST_TRANSACTION,
  NEW_TRANSACTION,
  ADDRESS_ENTRY,
  LICENCE_SUMMARY,
  LICENCE_TYPE,
  NAME
} from '../../../../uri.js'

import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'

import { ADULT_TODAY, dobHelper, JUNIOR_TODAY } from '../../../../__mocks__/test-utils-business-rules'
import { licenceToStart } from '../../../licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../../../licence-details/licence-type/route'

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

describe('The contact preferences page', () => {
  describe('where the prerequisite are not fulfilled', () => {
    beforeEach(async () => {
      await injectWithCookies('GET', CONTROLLER.uri)
    })

    it('redirects to the date-of-birth page if no date of birth has been set', async () => {
      const response = await injectWithCookies('GET', CONTACT.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
    })

    it('redirects to the licence to start page if no licence start date has been set has been set', async () => {
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      const response = await injectWithCookies('GET', CONTACT.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_TO_START.uri)
    })

    it('redirects to the licence length page if no length has been set', async () => {
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      const response = await injectWithCookies('GET', CONTACT.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
    })
  })

  describe('for a full 12 month licence, adult', () => {
    beforeEach(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    })

    it('return the page on request', async () => {
      const response = await injectWithCookies('GET', CONTACT.uri)
      expect(response.statusCode).toBe(200)
    })

    it('redirects to itself on an empty response', async () => {
      const response = await injectWithCookies('POST', CONTACT.uri, {})
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT.uri)
    })

    it('redirects to itself on an invalid contact method', async () => {
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'skype' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT.uri)
    })

    it('redirects to itself on an empty email', async () => {
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: '' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT.uri)
    })

    it('redirects to itself on an invalid email', async () => {
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'foo' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT.uri)
    })

    it('redirects to itself on an empty mobile number', async () => {
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'text', text: '' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT.uri)
    })

    it.each(['+44(0)7513438168', '923246734', 'email@com', '01179835413', '+457513 438 167'])(
      'redirects to itself on an invalid mobile number: %s',
      async mobileNumber => {
        const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'text', text: mobileNumber })
        expect(response.statusCode).toBe(302)
        expect(response.headers.location).toBe(CONTACT.uri)
      }
    )

    it('post response none sets how-contacted - letter, in the cache', async () => {
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toBeUndefined()
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.letter)
    })

    it('if letter is specified then the licence is subsequently changed to junior, contact type none is set in the cache, in the cache', async () => {
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    })

    it('post response email sets how-contacted - email, in the cache', async () => {
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toBeUndefined()
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.email)
    })

    it.each([
      ['07513438122', '07513438122'],
      ['07513 438167', '07513438167'],
      ['07513 438 167', '07513438167'],
      ['+447513 438 167', '+447513438167'],
      ['+44 7513 438 167', '+447513438167'],
      ['07513438168', '07513438168']
    ])('post response text sets how-contacted - text in the cache for mobile number %s', async (mobileNumberi, mobileNumbero) => {
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'text', text: mobileNumberi })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toBeUndefined()
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.text)
      expect(JSON.parse(payload).permissions[0].licensee.mobilePhone).toEqual(mobileNumbero)
    })

    it('controller redirects to the newsletter page if an email is given and licence is for you', async () => {
      await injectWithCookies('POST', LICENCE_FOR.uri, { 'licence-for': 'you' })
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(NEWSLETTER.uri)
    })

    it('controller redirects to the contact-summary page if an email is given and licence is for someone else', async () => {
      await injectWithCookies('POST', LICENCE_FOR.uri, { 'licence-for': 'someone-else' })
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
    })

    it('controller redirects to the newsletter page if a text number is given and licence is for you', async () => {
      await injectWithCookies('POST', LICENCE_FOR.uri, { 'licence-for': 'you' })
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'text', text: '07513 438167' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(NEWSLETTER.uri)
    })

    it('controller redirects to the contact-summary page if an text number is given and licence is for someone else', async () => {
      await injectWithCookies('POST', LICENCE_FOR.uri, { 'licence-for': 'someone-else' })
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'text', text: '07513 438167' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
    })
  })

  describe('for a junior licence', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(JUNIOR_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
    })

    it('post response none sets how-contacted - none in the cache', async () => {
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    })
  })

  describe('for 1 day licence', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    })

    it('post response none sets how-contacted - none in the cache', async () => {
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    })
  })

  describe('if the contact summary has been seen', () => {
    beforeAll(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('GET', CONTROLLER.uri)

      // Set up the licence details
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
      await injectWithCookies('POST', LICENCE_SUMMARY.uri)

      // Set up the contact details
      await injectWithCookies('POST', NAME.uri, { 'last-name': 'Graham', 'first-name': 'Willis' })
      await injectWithCookies('POST', ADDRESS_ENTRY.uri, goodAddress)
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'new3@example.com' })
      await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'yes', 'email-entry': 'no' })
      await injectWithCookies('GET', CONTACT_SUMMARY.uri)
    })

    it('controller redirects to the summary page', async () => {
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'none' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
    })
  })
})
