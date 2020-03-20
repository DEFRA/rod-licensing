'use strict'

import { start, stop, server, getCookies } from '../../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

let cookie

describe('The number of rods page', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy/number-of-rods'
    })
    expect(data.statusCode).toBe(200)

    cookie = getCookies(data)
  })

  it('Redirects back to itself on posting no response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/number-of-rods',
      payload: {},
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/number-of-rods')
  })

  it('Redirects back to itself on posting an invalid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/number-of-rods',
      payload: { 'number-of-rods': '9' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/number-of-rods')
  })

  it('Redirects back to the main controller on posting an valid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/number-of-rods',
      payload: { 'number-of-rods': '3' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/controller')
  })
})
