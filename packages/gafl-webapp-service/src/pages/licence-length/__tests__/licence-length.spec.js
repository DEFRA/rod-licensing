'use strict'

import each from 'jest-each'
import { start, stop, initialize, injectWithCookie } from '../../../misc/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The licence length page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', '/buy/licence-length')
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', '/buy/licence-length', {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-length')
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookie('POST', '/buy/licence-length', { 'licence-length': '8M' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-length')
  })

  each([
    ['12 Months', '12M'],
    ['8 day', '8D'],
    ['1 day', '1D']
  ]).it('stores the transaction on a successful submission of %s', async (desc, lenCode) => {
    await injectWithCookie('GET', '/buy/licence-length')
    const data = await injectWithCookie('POST', '/buy/licence-length', { 'licence-length': lenCode })

    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')

    // Hit the controller
    await injectWithCookie('GET', '/buy')

    // Get the transaction
    const { payload } = await injectWithCookie('GET', '/buy/transaction')

    expect(JSON.parse(payload).permissions[0].licenceLength).toBe(lenCode)
  })
})
