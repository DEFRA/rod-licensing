'use strict'

import { start, stop, initialize, injectWithCookie } from '../../../misc/test-utils.js'
import each from 'jest-each'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The number of rods page', () => {
  it('Return success on requesting', async () => {
    const data = await injectWithCookie('GET', '/buy/number-of-rods')
    expect(data.statusCode).toBe(200)
  })

  it('Redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', '/buy/number-of-rods', {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/number-of-rods')
  })

  it('Redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookie('POST', '/buy/number-of-rods', { 'number-of-rods': '9' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/number-of-rods')
  })

  each([
    ['2 rod licence', '2'],
    ['three rod licence', '3']
  ]).it('stores the transaction on successful submission of %s', async (desc, code) => {
    await injectWithCookie('POST', '/buy/number-of-rods', { 'number-of-rods': code })
    await injectWithCookie('GET', '/buy')
    const { payload } = await injectWithCookie('GET', '/buy/transaction')

    expect(JSON.parse(payload).permissions[0].numberOfRods).toBe(code)
  })
})
