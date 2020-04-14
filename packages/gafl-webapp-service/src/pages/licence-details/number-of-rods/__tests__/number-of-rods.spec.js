import { NUMBER_OF_RODS, CONTROLLER } from '../../../../constants.js'
import { start, stop, initialize, injectWithCookie } from '../../../../__mocks__/test-utils.js'
import each from 'jest-each'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The number of rods page', () => {
  it('Return success on requesting', async () => {
    const data = await injectWithCookie('GET', NUMBER_OF_RODS.uri)
    expect(data.statusCode).toBe(200)
  })

  it('Redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', NUMBER_OF_RODS.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NUMBER_OF_RODS.uri)
  })

  it('Redirects back to itself on posting an invalid response', async () => {
    const data = await injectWithCookie('POST', NUMBER_OF_RODS.uri, { 'number-of-rods': '9' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(NUMBER_OF_RODS.uri)
  })

  each([
    ['2 rod licence', '2'],
    ['three rod licence', '3']
  ]).it('stores the transaction on successful submission of %s', async (desc, code) => {
    await injectWithCookie('POST', NUMBER_OF_RODS.uri, { 'number-of-rods': code })
    await injectWithCookie('GET', CONTROLLER.uri)
    const { payload } = await injectWithCookie('GET', '/buy/transaction')

    expect(JSON.parse(payload).permissions[0].numberOfRods).toBe(code)
  })
})
