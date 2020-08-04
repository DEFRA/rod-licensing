import { NEWSLETTER, CONTACT, CONTACT_SUMMARY, TEST_TRANSACTION } from '../../../../uri.js'

import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The newsletter page', () => {
  it('returns success on request', async () => {
    await postRedirectGet(CONTACT.uri, { 'how-contacted': 'email', email: 'example@email.com' })
    const response = await injectWithCookies('GET', NEWSLETTER.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects to itself posting an empty response', async () => {
    const response = await injectWithCookies('POST', NEWSLETTER.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(NEWSLETTER.uri)
  })

  it('redirects to itself posting an invalid email response', async () => {
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
})
