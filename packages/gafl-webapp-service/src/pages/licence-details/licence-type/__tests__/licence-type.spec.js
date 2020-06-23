import { LICENCE_TYPE, CONTROLLER, TEST_TRANSACTION } from '../../../../uri.js'
import * as mappings from '../../../../processors/mapping-constants.js'
import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

// Start application before running the test case
describe('The licence type page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookies('GET', LICENCE_TYPE.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookies('POST', LICENCE_TYPE.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TYPE.uri)
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': 'hunting-licence' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_TYPE.uri)
  })

  it.each([
    ['Salmon and sea trout', 'salmon-and-sea-trout'],
    ['Trout and coarse', 'trout-and-coarse']
  ])('stores the transaction on successful submission of %s', async (desc, code) => {
    const data = await injectWithCookies('POST', LICENCE_TYPE.uri, { 'licence-type': code })

    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)

    // Hit the controller
    await injectWithCookies('GET', CONTROLLER.uri)

    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)

    expect(JSON.parse(payload).permissions[0].licenceType).toBe(mappings.LICENCE_TYPE[code])
  })
})
