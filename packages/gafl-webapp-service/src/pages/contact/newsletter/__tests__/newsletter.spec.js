import {
  NEWSLETTER,
  CONTACT,
  CONTACT_SUMMARY,
  TEST_TRANSACTION,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  NEW_TRANSACTION
} from '../../../../uri.js'

import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'

import { ADULT_TODAY, dobHelper } from '../../../../__mocks__/test-utils-business-rules'
import { licenceToStart } from '../../../licence-details/licence-to-start/update-transaction'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

describe('The newsletter page', () => {
  it('returns success on request', async () => {
    await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
    const response = await injectWithCookies('GET', NEWSLETTER.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects to itself posting an empty response', async () => {
    const response = await injectWithCookies('POST', NEWSLETTER.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NEWSLETTER.uri}#`)
  })

  it('redirects to itself posting an invalid email response', async () => {
    const response = await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'yes', email: 'foo', 'email-entry': 'yes' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${NEWSLETTER.uri}#`)
  })

  describe('if the user has set the preferred method of contact to email ', () => {
    beforeEach(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
    })

    it('if posting no it sets the newsletter contact method to none and preserves the contact methods and email', async () => {
      await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'no',
        'email-entry': 'no'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.none,
          preferredMethodOfReminder: HOW_CONTACTED.email,
          email: 'example@email.com'
        })
      )
    })

    it('if posting no it redirects to the summary page', async () => {
      const response = await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(`${CONTACT_SUMMARY.uri}#`)
    })

    it('if posting yes it sets the newsletter contact method to email and preserves the contact methods and email', async () => {
      await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.email,
          preferredMethodOfReminder: HOW_CONTACTED.email,
          email: 'example@email.com'
        })
      )
    })

    it('if posting yes and subsequently setting the preferred method of contact to text, the email is preserved', async () => {
      await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no'
      })
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'text', text: '+447000000000' })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.email,
          preferredMethodOfReminder: HOW_CONTACTED.text,
          email: 'example@email.com'
        })
      )
    })

    it('if posting yes it redirects to the summary page', async () => {
      const response = await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(`${CONTACT_SUMMARY.uri}#`)
    })
  })

  describe('if the user has set the preferred method of contact to text ', () => {
    beforeEach(async () => {
      await injectWithCookies('GET', NEW_TRANSACTION.uri)
      await injectWithCookies('POST', DATE_OF_BIRTH.uri, dobHelper(ADULT_TODAY))
      await injectWithCookies('POST', LICENCE_TO_START.uri, { 'licence-to-start': licenceToStart.AFTER_PAYMENT })
      await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
      await injectWithCookies('POST', CONTACT.uri, { 'how-contacted': 'text', text: '07900000000' })
    })

    it('if posting no it sets the newsletter contact method to none and preserves the email address', async () => {
      await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'no',
        'email-entry': 'yes'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.none,
          preferredMethodOfReminder: HOW_CONTACTED.text
        })
      )
    })

    it('if posting no it redirects to the summary page', async () => {
      const response = await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'no',
        'email-entry': 'yes'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(`${CONTACT_SUMMARY.uri}#`)
    })

    it('if posting yes it sets the newsletter contact method to email and sets the email address', async () => {
      await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'yes',
        email: 'example@email.com'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      const {
        permissions: [{ licensee }]
      } = JSON.parse(payload)
      expect(licensee).toEqual(
        expect.objectContaining({
          preferredMethodOfNewsletter: HOW_CONTACTED.email,
          preferredMethodOfReminder: HOW_CONTACTED.text,
          email: 'example@email.com'
        })
      )
    })

    it('if posting yes it redirects to the summary page', async () => {
      const response = await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'no',
        email: 'example@email.com'
      })
      expect(response.statusCode).toBe(302)
      expect(response.headers.location).toBe(`${CONTACT_SUMMARY.uri}#`)
    })

    it('if having previously posting yes and subsequently posting no, it sets the email', async () => {
      await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'yes',
        'email-entry': 'yes',
        email: 'example@email.com'
      })
      await injectWithCookies('POST', NEWSLETTER.uri, {
        newsletter: 'no',
        'email-entry': 'no'
      })
      const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfNewsletter).toBe(HOW_CONTACTED.none)
      expect(JSON.parse(payload).permissions[0].licensee.email).toBe('example@email.com')
    })
  })
})
