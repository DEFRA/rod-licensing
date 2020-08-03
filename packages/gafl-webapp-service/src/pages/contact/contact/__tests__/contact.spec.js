import {
  CONTACT,
  LICENCE_LENGTH,
  CONTROLLER,
  DATE_OF_BIRTH,
  LICENCE_TO_START,
  CONTACT_SUMMARY,
  NEWSLETTER,
  TEST_TRANSACTION
  , LICENCE_SUMMARY, LICENCE_TYPE
} from '../../../../uri.js'

import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

import { ADULT_TODAY, dobHelper } from '../../../../__mocks__/test-helpers'
import { licenceToStart } from '../../../licence-details/licence-to-start/update-transaction'
import { licenseTypes } from '../../../licence-details/licence-type/route'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The contact preferences page', () => {
  describe('where the prerequisite are not fulfilled', async () => {
    beforeAll(async d => {
      await injectWithCookies('GET', CONTROLLER.uri)
      d()
    })

    it('redirects to the date-of-birth page if no date of birth has been set', async () => {
      const response = await injectWithCookies('GET', CONTACT.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(DATE_OF_BIRTH.uri)
    })

    it('redirects to the licence to start page if no licence start date has been set has been set', async () => {
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      const response = await injectWithCookies('GET', CONTACT.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_TO_START.uri)
    })

    it('redirects to the licence length page if no length has been set', async () => {
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      const response = await injectWithCookies('GET', CONTACT.uri)
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
    })
  })

  describe('for a full 12 month, 2 rod, trout and coarse licence', async () => {
    beforeAll(async d => {
      await injectWithCookies('GET', CONTROLLER.uri)
      await postRedirectGet(DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      d()
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

    it('redirects to itself on an invalid mobile number', async () => {
      const response = await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'text', text: 'foo' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT.uri)
    })

    it('a 1 day licence sets the contact method to none', async () => {
      await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '1D' })
      await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none' })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    })

    it('an 8 day licence sets the contact method to none', async () => {
      await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '8D' })
      await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none' })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    })

    it('controller redirects to the summary page if no contact given', async () => {
      const response = await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
    })

    it('controller redirects to the newsletter page if an email is given', async () => {
      const response = await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(NEWSLETTER.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.email)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.email)
    })

    it('controller redirects to the newsletter page if a text number is given', async () => {
      const response = await postRedirectGet(CONTACT.uri, { 'how-contacted': 'text', text: '+22 0445638902' })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(NEWSLETTER.uri)
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.text)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.text)
    })
  })
})
