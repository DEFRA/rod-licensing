import { start, stop, server, getCookies } from '../../../misc/test-utils.js'
import { CONTROLLER, SUMMARY } from '../../../constants'
// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

let cookie

describe('The summary', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: SUMMARY.uri
    })
    expect(data.statusCode).toBe(200)

    cookie = getCookies(data)
  })

  it('Redirects back to the main controller on continuation', async () => {
    const data = await server.inject({
      method: 'POST',
      url: SUMMARY.uri,
      headers: { cookie: 'sid=' + cookie.sid }
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
  })
})
