'use strict'

import { start, stop, server, getCookies } from '../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The new permission handler', () => {
  it('Adds new permission objects to the transaction cache', async () => {
    // Add a new route to return the transaction cache
    server.route({
      method: 'GET',
      path: '/test-transaction',
      handler: async request => {
        return request.cache().get('transaction')
      }
    })

    // Add a permission
    const res = await server.inject({
      method: 'GET',
      url: '/buy/add'
    })

    const cookie = getCookies(res)

    const transaction1 = await server.inject({
      method: 'GET',
      url: '/test-transaction',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(transaction1.payload).permissions.length).toBe(1)

    // Add another
    await server.inject({
      method: 'GET',
      url: '/buy/add',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    const transaction2 = await server.inject({
      method: 'GET',
      url: '/test-transaction',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(transaction2.payload).permissions.length).toBe(2)
  })
})
