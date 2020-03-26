'use strict'

import { LICENCE_LENGTH, CONTROLLER } from '../../../constants.js'
import each from 'jest-each'
import { start, stop, initialize, injectWithCookie } from '../../../misc/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The licence length page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', LICENCE_LENGTH.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': '8M' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  each([
    ['12 Months', '12M'],
    ['8 day', '8D'],
    ['1 day', '1D']
  ]).it('stores the transaction on a successful submission of %s', async (desc, lenCode) => {
    await injectWithCookie('GET', LICENCE_LENGTH.uri)
    const data = await injectWithCookie('POST', LICENCE_LENGTH.uri, { 'licence-length': lenCode })

    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)

    // Hit the controller
    await injectWithCookie('GET', CONTROLLER.uri)

    // Get the transaction
    const { payload } = await injectWithCookie('GET', '/buy/transaction')

    expect(JSON.parse(payload).permissions[0].licenceLength).toBe(lenCode)
  })
})
