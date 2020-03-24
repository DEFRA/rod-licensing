import { start, stop, server, getCookies } from '../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

beforeAll(() =>
  server.route({
    method: 'GET',
    path: '/transaction',
    handler: request => {
      try {
        return request.cache().get('transaction')
      } catch (err) {
        return err
      }
    }
  })
)

let cookie

describe('The controller handler', () => {
  it('If there is no transaction then initialize and redirect to create new permission', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy'
    })
    cookie = getCookies(data)

    // const { payload } = await server.inject({
    //   method: 'GET',
    //   url: '/transaction',
    //   headers: { cookie: 'sid=' + cookie.sid }
    // })

    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/add')
  })

  it('Where there is no current page return a redirect to the start of the journey', async () => {
    await server.inject({
      method: 'GET',
      url: '/buy/add',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    const data = await server.inject({
      method: 'GET',
      url: '/buy',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/licence-length')
  })
})
