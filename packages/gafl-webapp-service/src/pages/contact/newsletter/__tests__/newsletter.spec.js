import { CONTROLLER, NEWSLETTER, CONTACT, DATE_OF_BIRTH, LICENCE_LENGTH, LICENCE_TO_START, CONTACT_SUMMARY } from '../../../../constants.js'

import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

import { start, stop, initialize, injectWithCookie, postRedirectGet } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The newsletter page', () => {
  it('returns success on request', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookie('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1951'
    })
    await injectWithCookie('GET', CONTROLLER.uri)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })

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

  it('when posting no it saves the newsletter response without overwriting a pre-existing email', async () => {
    const data = await postRedirectGet(NEWSLETTER.uri, { newsletter: 'no', email: 'example2@email.com' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)

    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfNewsletter).toBeFalsy()
    expect(JSON.parse(payload).permissions[0].licensee.email).toBe('example@email.com')
  })

  it('when posting yes it saves the marketing flag overwriting any pre-existing email', async () => {
    const data = await postRedirectGet(NEWSLETTER.uri, { newsletter: 'yes', email: 'example2@email.com' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)

    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfNewsletter).toBe(HOW_CONTACTED.email)
    expect(JSON.parse(payload).permissions[0].licensee.email).toBe('example2@email.com')
  })

  it('with an email previously entered and the preferred method of contact is letter, when posting no - delete the email address', async () => {
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none', email: 'example@email.com' })
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toBe(HOW_CONTACTED.letter)

    await postRedirectGet(NEWSLETTER.uri, { newsletter: 'no' })

    const { payload: payload2 } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload2).permissions[0].licensee.email).toBeFalsy()
  })
})
