import { ADDRESS_SELECT } from '../../../../../constants.js'
import { start, stop, initialize, injectWithCookie } from '../../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The address select page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', ADDRESS_SELECT.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an empty payload', async () => {
    const data = await injectWithCookie('POST', ADDRESS_SELECT.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_SELECT.uri)
  })

  it('redirects back to itself on posting an no address', async () => {
    const data = await injectWithCookie('POST', ADDRESS_SELECT.uri, { address: '' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_SELECT.uri)
  })

  // it('the controller redirects to teh contact page after success', async () => {
  //   const data = await injectWithCookie('POST', ADDRESS_SELECT.uri, {premises: '5', postcode: ''})
  //   expect(data.statusCode).toBe(302)
  //   expect(data.headers.location).toBe(ADDRESS_LOOKUP.uri)
  // })
})
