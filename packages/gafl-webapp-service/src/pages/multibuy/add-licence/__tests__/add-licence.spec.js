import { ADD_LICENCE, ADD_PERMISSION, CONTACT_SUMMARY, LICENCE_SUMMARY, TERMS_AND_CONDITIONS } from '../../../../uri.js'

import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The add licence page', () => {
  it('redirects to the licence summary page if it has not been visited', async () => {
    const data = await injectWithCookies('GET', ADD_LICENCE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_SUMMARY.uri)
  })

  it('redirects to the contact summary page if it has not been visited', async () => {
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)
    const data = await injectWithCookies('GET', ADD_LICENCE.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT_SUMMARY.uri)
  })

  it('Return success on requesting', async () => {
    await injectWithCookies('POST', LICENCE_SUMMARY.uri)
    await injectWithCookies('POST', CONTACT_SUMMARY.uri)
    const response = await injectWithCookies('GET', ADD_LICENCE.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects to itself posting an empty response', async () => {
    const response = await injectWithCookies('POST', ADD_LICENCE.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADD_LICENCE.uri)
  })

  it('if posting no it redirects to the terms and conditions page', async () => {
    const response = await injectWithCookies('POST', ADD_LICENCE.uri, { 'add-licence': 'no' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(TERMS_AND_CONDITIONS.uri)
  })

  it('if posting yes it redirects to add permission', async () => {
    const response = await injectWithCookies('POST', ADD_LICENCE.uri, { 'add-licence': 'yes' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(ADD_PERMISSION.uri)
  })
})
