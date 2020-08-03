import {
  CONTROLLER,
  NEWSLETTER,
  CONTACT,
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  CONTACT_SUMMARY,
  TEST_TRANSACTION
} from '../../../../uri.js'

import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The newsletter page', () => {
  it('returns success on request', async () => {
    await postRedirectGet(LICENCE_LENGTH.uri, { 'licence-length': '12M' })
    await postRedirectGet(LICENCE_TO_START.uri, { 'licence-to-start': 'after-payment' })
    await injectWithCookies('POST', DATE_OF_BIRTH.uri, {
      'date-of-birth-day': '11',
      'date-of-birth-month': '11',
      'date-of-birth-year': '1951'
    })
    await injectWithCookies('GET', CONTROLLER.uri)
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })

    const response = await injectWithCookies('GET', NEWSLETTER.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects to itself posing an empty response', async () => {
    const response = await injectWithCookies('POST', NEWSLETTER.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(NEWSLETTER.uri)
  })

  it('redirects to itself posing an invalid email response', async () => {
    const response = await injectWithCookies('POST', NEWSLETTER.uri, { newsletter: 'yes', email: 'foo' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(NEWSLETTER.uri)
  })

  it('when posting no it saves the newsletter response without overwriting a pre-existing email', async () => {
    const response = await postRedirectGet(NEWSLETTER.uri, { newsletter: 'no', email: 'example2@email.com' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(CONTACT_SUMMARY.uri)

    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfNewsletter).toBe(HOW_CONTACTED.none)
    expect(JSON.parse(payload).permissions[0].licensee.email).toBe('example@email.com')
  })

  it('with an email previously entered and the preferred method of contact is letter, when posting no - delete the email address', async () => {
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'none', email: 'example@email.com' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee.preferredMethodOfConfirmation).toBe(HOW_CONTACTED.letter)
    await postRedirectGet(NEWSLETTER.uri, { newsletter: 'no' })
    const { payload: payload2 } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload2).permissions[0].licensee.email).toBeFalsy()
  })
})
