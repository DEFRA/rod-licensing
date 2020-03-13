'use strict'

import { createServer, init, server } from '../../../../src/server.js'
import CatboxMemory from '@hapi/catbox-memory'

const getCookies = response => {
  const cookies = {}
  response.headers['set-cookie'] &&
    response.headers['set-cookie'].forEach(cookie => {
      const parts = cookie.split(';')[0].match(/(.*?)=(.*)$/)
      cookies[parts[1].trim()] = (parts[2] || '').trim()
    })
  return cookies
}

createServer({
  cache: [
    {
      provider: {
        constructor: CatboxMemory
      }
    }
  ]
})

// Start application before running the test case
beforeAll(async done => {
  server.events.on('start', () => {
    done()
  })
  await init()
})

// Stop application after running the test case
afterAll(done => {
  server.events.on('stop', () => {
    done()
  })
  server.stop()
})

let cookie

describe('The name page', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/name'
    })
    expect(data.statusCode).toBe(200)

    cookie = getCookies(data)
  })

  it('Redirects back to itself on posting an invalid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/name',
      payload: { name: 'a', email: 'a' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('name')
  })

  it('Redirects back to the main controller on posting an valid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: '/name',
      payload: { name: 'Graham Willis', email: 'email@example.com' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/controller')
  })
})
