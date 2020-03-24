'use strict'

import { start, stop, server, getCookies } from '../../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

let cookie

describe('The when would you like you licence to start page', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy/licence-to-start'
    })
    expect(data.statusCode).toBe(200)

    cookie = getCookies(data)
  })

  it('Redirects back to itself on posting no response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/licence-to-start',
      payload: {},
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-to-start')
  })

  it('Redirects back to itself on posting an invalid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/licence-to-start',
      payload: { 'licence-to-start': 'foo' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-to-start')
  })

  it('Redirects back to the main controller on posting an valid after payment response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/licence-to-start',
      payload: { 'licence-to-start': 'after-payment' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')
  })

  it('Redirects back to the main controller on posting an valid another data or time', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/licence-to-start',
      payload: { 'licence-to-start': 'another-date-or-time' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')
  })
})
