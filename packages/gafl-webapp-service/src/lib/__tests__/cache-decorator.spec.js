import { start, stop, server, getCookies } from '../../misc/test-utils.js'
import { NAME } from '../../constants.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

let cookie

beforeEach(async () => {
  const data = await server.inject({
    method: 'GET',
    url: NAME.uri
  })
  cookie = getCookies(data)
})

describe('The cache decorator', () => {
  it('Completes with a good context', async () => {
    server.route({
      method: 'GET',
      path: '/test1',
      handler: async request => {
        try {
          await request.cache().set('page', { foo: 'bar' })
          return 'ok'
        } catch (err) {
          console.error(err)
          return 'bad'
        }
      }
    })

    const data = await server.inject({
      method: 'GET',
      url: '/test1',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(data.result).toBe('ok')
  })

  it('Throws on a bad context', async () => {
    server.route({
      method: 'GET',
      path: '/test2',
      handler: async request => {
        try {
          await request.cache().set('bad', { foo: 'bar' })
          return 'ok'
        } catch (err) {
          return 'bad'
        }
      }
    })

    const data = await server.inject({
      method: 'GET',
      url: '/test2',
      headers: { cookie: 'sid=' + cookie.sid }
    })

    expect(data.result).toBe('bad')
  })
})
