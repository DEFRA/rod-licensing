'use strict'
import { NAME, CONTROLLER } from '../../../constants.js'
import { start, stop, server, getCookies } from '../../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

let cookie

describe('The name page', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: NAME.uri
    })
    expect(data.statusCode).toBe(200)

    cookie = getCookies(data)
  })

  it('Redirects back to itself on posting an invalid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: NAME.uri,
      payload: { name: 'a', email: 'a' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NAME.uri)
  })

  it('Redirects back to the main controller on posting an valid response', async () => {
    const data = await server.inject({
      method: 'POST',
      url: NAME.uri,
      payload: { name: 'Graham Willis', email: 'email@example.com' },
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
  })
})
