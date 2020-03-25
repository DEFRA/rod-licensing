'use strict'

import { start, stop, initialize, injectWithCookie } from '../../../misc/test-utils.js'
import each from 'jest-each'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

// Start application before running the test case
describe('The licence type page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', '/buy/licence-type')
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', '/buy/licence-type', {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-type')
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookie('POST', '/buy/licence-type', { 'licence-type': 'hunting-licence' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-type')
  })

  each([
    ['salmon and sea trout', 'salmon-and-sea-trout'],
    ['trout and coarse', 'trout-and-coarse']
  ]).it('stores the transaction on successful submission of %s', async (desc, code) => {
    const data = await injectWithCookie('POST', '/buy/licence-type', { 'licence-type': code })

    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')

    // Hit the controller
    await injectWithCookie('GET', '/buy')

    const { payload } = await injectWithCookie('GET', '/buy/transaction')

    expect(JSON.parse(payload).permissions[0].licenceType).toBe(code)
  })
})
