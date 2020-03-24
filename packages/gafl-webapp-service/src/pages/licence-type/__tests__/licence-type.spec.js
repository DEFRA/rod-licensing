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

describe('The licence type page', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy/licence-type',
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(200)
  })

  it('Redirects back to itself on posting no response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/licence-type',
      payload: {},
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-type')
  })

  it('Redirects back to itself on posting an invalid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/licence-type',
      payload: { 'licence-type': 'hunting-licence' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-type')
  })

  it('The transaction is written to the cache on selecting salmon and sea trout', async () => {
    let data = await server.inject({
      method: 'POST',
      url: '/buy/licence-type',
      payload: { 'licence-type': 'salmon-and-sea-trout' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')

    // Hit the controller
    data = await server.inject({
      method: 'GET',
      url: '/buy',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    const { payload } = await server.inject({
      method: 'GET',
      url: '/buy/transaction',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(payload).permissions[0].licenceType).toBe('salmon-and-sea-trout')
  })

  it('The transaction is written to the cache on selecting trout and coarse', async () => {
    let data = await server.inject({
      method: 'POST',
      url: '/buy/licence-type',
      payload: { 'licence-type': 'trout-and-coarse' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')

    // Hit the controller
    data = await server.inject({
      method: 'GET',
      url: '/buy',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    const { payload } = await server.inject({
      method: 'GET',
      url: '/buy/transaction',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(payload).permissions[0].licenceType).toBe('trout-and-coarse')
  })
})
