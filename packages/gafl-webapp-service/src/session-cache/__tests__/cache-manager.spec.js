import { start, stop, initialize, injectWithCookies, mockSalesApi } from '../../__mocks__/test-utils-system.js'
import { CONTROLLER, LICENCE_TYPE } from '../../uri.js'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

mockSalesApi()

describe('The session cache removal', () => {
  it('will result in a redirect to the controller', async () => {
    await injectWithCookies('GET', '/buy/clear-cache')
    const response = await injectWithCookies('GET', LICENCE_TYPE.uri)
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })

  /*
   * The reason it must is that the error handler built into hapi acts before the request pre-handler and so
   * will throw an exception on the cache read failure because the pre-handler has not had time to restore the
   * session cache. This is caught and the controller is invoked with a redirect
   */
  it('will redirect to the start of the journey an invalid post response', async () => {
    await injectWithCookies('GET', '/buy/clear-cache')
    const response = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': 'hunting-licence' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toHaveValidPathFor(CONTROLLER.uri)
  })
})
