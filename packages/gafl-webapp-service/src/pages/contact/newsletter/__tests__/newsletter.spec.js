import {
  CONTROLLER,
  NEWSLETTER,
  CONTACT,
  DATE_OF_BIRTH,
  HOW_CONTACTED,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  SUMMARY
} from '../../../../constants.js'
import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The newsletter page', () => {
  it('redirects to the contact page if a contact method is not set', async () => {
    const data = await injectWithCookie('GET', NEWSLETTER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('returns success on request', async () => {
    await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1951'
    })
    await injectWithCookie('GET', CONTROLLER.uri)
    await injectWithCookie('POST', CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
    await injectWithCookie('GET', CONTROLLER.uri)

    const data = await injectWithCookie('GET', NEWSLETTER.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects to itself posing an empty response', async () => {
    const data = await injectWithCookie('POST', NEWSLETTER.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NEWSLETTER.uri)
  })

  it('redirects to itself posing an invalid email response', async () => {
    const data = await injectWithCookie('POST', NEWSLETTER.uri, { newsletter: 'yes', email: 'foo' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NEWSLETTER.uri)
  })

  it('when posting no it saves the marketing flag without overwriting a pre-existing email', async () => {
    await injectWithCookie('POST', NEWSLETTER.uri, { newsletter: 'no', email: 'example2@email.com' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(SUMMARY.uri)

    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].contact.method).toBe(HOW_CONTACTED.email)
    expect(JSON.parse(payload).permissions[0].contact.marketingFlag).toBeFalsy()
    expect(JSON.parse(payload).permissions[0].contact.emailAddress).toBe('example@email.com')
  })

  it('when posting yes it saves the marketing flag without overwriting a pre-existing email', async () => {
    await injectWithCookie('POST', NEWSLETTER.uri, { newsletter: 'yes', email: 'example2@email.com' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(SUMMARY.uri)

    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].contact.method).toBe(HOW_CONTACTED.email)
    expect(JSON.parse(payload).permissions[0].contact.marketingFlag).not.toBeFalsy()
    expect(JSON.parse(payload).permissions[0].contact.emailAddress).toBe('example2@email.com')
  })
})
