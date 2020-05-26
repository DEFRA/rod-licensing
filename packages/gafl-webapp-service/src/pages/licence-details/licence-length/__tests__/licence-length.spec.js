import { LICENCE_LENGTH, CONTROLLER, TEST_TRANSACTION } from '../../../../uri.js'
import each from 'jest-each'
import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The licence length page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookies('GET', LICENCE_LENGTH.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookies('POST', LICENCE_LENGTH.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  it('redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': '8M' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(LICENCE_LENGTH.uri)
  })

  each([
    ['12 months', '12M'],
    ['8 day', '8D'],
    ['1 day', '1D']
  ]).it('stores the transaction on a successful submission of %s', async (desc, lenCode) => {
    await injectWithCookies('GET', LICENCE_LENGTH.uri)
    const data = await injectWithCookies('POST', LICENCE_LENGTH.uri, { 'licence-length': lenCode })

    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTROLLER.uri)

    // Hit the controller
    await injectWithCookies('GET', CONTROLLER.uri)

    // Get the transaction
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)

    expect(JSON.parse(payload).permissions[0].licenceLength).toBe(lenCode)
  })
})
