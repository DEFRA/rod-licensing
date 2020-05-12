import { start, stop, initialize, injectWithCookie, injectWithoutCookie } from '../../__mocks__/test-utils.js'
import { CONTROLLER, LICENCE_LENGTH, LICENCE_TYPE } from '../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The user', () => {
  it('clearing the session cookie automatically create a new cookie and cache', async () => {
    const data = await injectWithoutCookie('GET', LICENCE_TYPE.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Clearing the session cookie will redirect to the start of the journey on a post valid response', async () => {
    let data = await injectWithoutCookie('POST', LICENCE_TYPE.uri, { 'licence-type': 'trout-and-coarse' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  /*
   * The reason it must it that the error handler built into hapi acts before the request pre-handler and so
   * will throw an exception on the cache read failure because the pre-handler has not had time to restore the
   * cookie and reinitialize the cache. This is caught and the controller is invoked with a redirect
   */
  it('clearing the session cookie will redirect to the start of the journey on a post invalid response', async () => {
    let data = await injectWithoutCookie('POST', LICENCE_TYPE.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)
    data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
    data = await injectWithCookie('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })
})
