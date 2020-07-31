import { start, stop, initialize, injectWithCookies } from '../../__mocks__/test-utils.js'
import { CONTROLLER, LICENCE_LENGTH, LICENCE_TYPE, LICENCE_TO_START } from '../../uri.js'
import { licenseTypes } from '../../pages/licence-details/licence-type/route.js'
import { postRedirectGet } from '../../__mocks__/test-utils'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The session cache removal', () => {
  it('will not disrupt the flow of the journey on a simple get', async () => {
    await injectWithCookies('GET', '/buy/clear-cache')
    const response = await injectWithCookies('GET', LICENCE_TYPE.uri)
    expect(response.statusCode).toBe(200)
  })

  it('will not disrupt the flow of the journey a valid post response', async () => {
    await injectWithCookies('GET', '/buy/clear-cache')
    const response = await postRedirectGet(LICENCE_TYPE.uri, { 'licence-type': licenseTypes.troutAndCoarse2Rod })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(LICENCE_LENGTH.uri)
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
    expect(response.headers.location).toBe(CONTROLLER.uri)
  })
})
