import { start, stop, server } from '../../__mocks__/test-utils.js'
import { REFUND_POLICY, ACCESSIBILITY_STATEMENT, COOKIES, PRIVACY_POLICY } from '../../uri.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The miscellaneous route handlers', () => {
  it('redirect to the main controller when / is requested', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')
  })

  it('return the refund policy page when requested', async () => {
    const data = await server.inject({
      method: 'GET',
      url: REFUND_POLICY.uri
    })
    expect(data.statusCode).toBe(200)
  })

  it('return the privacy policy page when requested', async () => {
    const data = await server.inject({
      method: 'GET',
      url: PRIVACY_POLICY.uri
    })
    expect(data.statusCode).toBe(200)
  })

  it('return the accessibility statement page when requested', async () => {
    const data = await server.inject({
      method: 'GET',
      url: ACCESSIBILITY_STATEMENT.uri
    })
    expect(data.statusCode).toBe(200)
  })

  it('return the cookie page when requested', async () => {
    const data = await server.inject({
      method: 'GET',
      url: COOKIES.uri
    })
    expect(data.statusCode).toBe(200)
  })
})
