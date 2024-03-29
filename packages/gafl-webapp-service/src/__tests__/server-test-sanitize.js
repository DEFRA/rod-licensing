import { start, stop, initialize, injectWithCookies, server } from '../__mocks__/test-utils-system.js'

beforeAll(() => new Promise(resolve => start(resolve)))

beforeAll(() => new Promise(resolve => initialize(resolve)))

beforeAll(() => {
  server.route({
    method: 'POST',
    path: '/public/input-input/{uri}',
    handler: async request => ({
      payload: request.payload,
      uri: request.params.uri,
      query: request.query
    })
  })
})

afterAll(d => stop(d))

describe('That the server', () => {
  it('sanitizes user input', async () => {
    const data = await injectWithCookies('POST', '/public/input-input/<script>?thing=<script>', { foo: '<script></script>' })
    expect(data.statusCode).toBe(200)
    expect(JSON.parse(data.payload).payload.foo).toBe('')
    expect(JSON.parse(data.payload).uri).toBe('')
    expect(JSON.parse(data.payload).query).toEqual({ thing: '' })
  })
})
