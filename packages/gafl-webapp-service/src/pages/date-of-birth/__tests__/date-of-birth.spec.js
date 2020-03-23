'use strict'

import { start, stop, server, getCookies } from '../../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

let cookie

describe('The date of birth page', () => {
  it('Return success on requesting', async () => {
    cookie = getCookies(
      await server.inject({
        method: 'GET',
        url: '/buy/add'
      })
    )

    const data = await server.inject({
      method: 'GET',
      url: '/buy/date-of-birth'
    })
    expect(data.statusCode).toBe(200)
  })

  it('Redirects back to itself on posting no response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/date-of-birth',
      payload: {},
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/date-of-birth')
  })

  it('Redirects back to itself on posting an invalid date', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/date-of-birth',
      payload: {
        'date-of-birth-day': '45',
        'date-of-birth-month': '13',
        'date-of-birth-year': '1970'
      },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/date-of-birth')
  })

  it('Redirects back to the main controller on posting an valid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/buy/date-of-birth',
      payload: {
        'date-of-birth-day': '22',
        'date-of-birth-month': '1',
        'date-of-birth-year': '1970'
      },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')
  })

  it('The main controller returns a redirect to the next page', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy',
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/no-licence-required')
  })

  it('The transaction contains the date of birth information', async () => {
    server.route({
      method: 'GET',
      path: '/transaction',
      handler: async request => request.cache().get('transaction')
    })

    const { payload } = await server.inject({
      method: 'GET',
      url: '/transaction',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe('1970-02-22')
  })
})
