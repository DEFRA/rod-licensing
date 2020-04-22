import { CONTACT, LICENCE_LENGTH, CONTROLLER, DATE_OF_BIRTH, LICENCE_TO_START, CONTACT_SUMMARY, NEWSLETTER } from '../../../../constants.js'

import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The contact preferences page', () => {
  it('redirects to the licence length page if the licence length is not set', async () => {
    const data = await injectWithCookie('GET', CONTACT.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('redirects to the licence-to-start page if the licence-start-date is not set', async () => {
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', CONTACT.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TO_START.uri)
  })

  it('redirects to the date-of-birth page if the date-of-birth is not set', async () => {
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', CONTACT.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(DATE_OF_BIRTH.uri)
  })

  it('return the page on request', async () => {
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1951'
    })
    await injectWithCookie('GET', CONTROLLER.uri)
    const data = await injectWithCookie('GET', CONTACT.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects to itself on an empty response', async () => {
    const data = await injectWithCookie('POST', CONTACT.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('redirects to itself on an invalid contact method', async () => {
    const data = await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'skype' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('redirects to itself on an empty email', async () => {
    const data = await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'email', email: '' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('redirects to itself on an invalid email', async () => {
    const data = await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'foo' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('redirects to itself on an empty mobile number', async () => {
    const data = await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'text', text: '' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('redirects to itself on an invalid mobile number', async () => {
    const data = await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'text', text: 'foo' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('an adult licence sets the contact method to letter', async () => {
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1951'
    })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'none' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.letter)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.letter)
  })

  it('a 1 day licence sets the contact method to none', async () => {
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '1D' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'none' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
  })

  it('an 8 day licence sets the contact method to none', async () => {
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '8D' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'none' })
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
  })

  it('controller redirects to the summary page if no contact given', async () => {
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'none' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.none)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.none)
  })

  it('controller redirects to the newsletter page if an email is given', async () => {
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NEWSLETTER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.email)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.email)
  })

  it('controller redirects to the newsletter page if a text number is given', async () => {
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'text', text: '+22 0445638902' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NEWSLETTER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toEqual(HOW_CONTACTED.text)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfReminder).toEqual(HOW_CONTACTED.text)
  })
})
