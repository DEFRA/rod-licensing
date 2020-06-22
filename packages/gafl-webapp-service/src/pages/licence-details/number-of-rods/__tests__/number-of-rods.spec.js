import { NUMBER_OF_RODS, TEST_TRANSACTION } from '../../../../uri.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The number of rods page', () => {
  it('Return success on requesting', async () => {
    const data = await injectWithCookies('GET', NUMBER_OF_RODS.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Redirects back to itself on posting no response', async () => {
    const data = await injectWithCookies('POST', NUMBER_OF_RODS.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NUMBER_OF_RODS.uri)
  })

  it('Redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookies('POST', NUMBER_OF_RODS.uri, { 'number-of-rods': '9' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NUMBER_OF_RODS.uri)
  })

  it.each([
    ['2 rod licence', '2'],
    ['three rod licence', '3']
  ])('stores the transaction on successful submission of %s', async (desc, code) => {
    await postRedirectGet(NUMBER_OF_RODS.uri, { 'number-of-rods': code })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].numberOfRods).toBe(code)
  })
})
