import { start, stop, initialize, injectWithoutSessionCookie } from '../__mocks__/test-utils-system.js'

beforeAll(d => {
  start(d)
})

beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('Where the server is started', () => {
  it('serve public resources without the session cookie', async () => {
    const data = await injectWithoutSessionCookie('GET', '/public/stylesheets/main.css')
    expect(data.statusCode).toBe(200)
    const data2 = await injectWithoutSessionCookie('GET', '/favicon.ico')
    expect(data2.statusCode).toBe(200)
  })
})
