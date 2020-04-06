import { ADDRESS_LOOKUP, ADDRESS_SELECT, CONTROLLER, ADDRESS_ENTRY } from '../../../../../constants.js'
import { start, stop, initialize, injectWithCookie } from '../../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The address lookup page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', ADDRESS_LOOKUP.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an empty payload', async () => {
    const data = await injectWithCookie('POST', ADDRESS_LOOKUP.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_LOOKUP.uri)
  })

  it('redirects back to itself on posting an empty premises', async () => {
    const data = await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: '', postcode: 'BS9 1HJ' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_LOOKUP.uri)
  })

  it('redirects back to itself on posting an empty postcode', async () => {
    const data = await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: '5', postcode: '' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_LOOKUP.uri)
  })

  it('redirects back to itself on posting a bad postcode', async () => {
    const data = await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: '5', postcode: 'foo' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_LOOKUP.uri)
  })

  it('redirects back to itself on posting a too long premises', async () => {
    const data = await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: 'a'.repeat(51), postcode: 'BS9 1HJ' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_LOOKUP.uri)
  })

  it('on finding list of multiple found addresses redirects to the select page', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'
    await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_SELECT.uri)
  })

  it('on finding list of a single found address redirects to the select page', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'
    await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_SELECT.uri)
  })

  it('redirects to the entry page where there is no result', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'
    await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects to the entry page where there an exception thrown in the address lookup request', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'
    await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects to the entry page where there is no lookup set up', async () => {
    delete process.env.ADDRESS_LOOKUP_URL
    delete process.env.ADDRESS_LOOKUP_KEY
    await injectWithCookie('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    const data = await injectWithCookie('GET', CONTROLLER.uri)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })
})
