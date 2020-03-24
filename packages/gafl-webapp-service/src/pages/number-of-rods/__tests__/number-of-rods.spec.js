'use strict'

import { start, stop, server, getCookies } from '../../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

let cookie

// Start a new permission
beforeAll(async () => {
  const data = await server.inject({
    method: 'GET',
    url: '/buy/add'
  })

  cookie = getCookies(data)
})

beforeAll(() =>
  server.route({
    method: 'GET',
    path: '/buy/transaction',
    handler: async request => {
      try {
        return request.cache().get('transaction')
      } catch (err) {
        return err
      }
    }
  })
)

// Stop application after running the test case
afterAll(d => stop(d))

describe('The number of rods page', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy/number-of-rods',
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(200)
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

  it('On passing the validation the controller writes to the cache', async () => {
    await server.inject({
      method: 'POST',
      url: '/buy/number-of-rods',
      payload: { 'number-of-rods': '3' },
      headers: { cookie: 'sid=' + cookie.sid }
    })

    await server.inject({
      method: 'GET',
      url: '/buy',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    const { payload } = await server.inject({
      method: 'GET',
      url: '/buy/transaction',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(payload).permissions[0].numberOfRods).toBe('3')
  })
})
