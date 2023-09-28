import { ADDRESS_LOOKUP, ADDRESS_SELECT, ADDRESS_ENTRY } from '../../../../../uri.js'
import { start, stop, initialize, injectWithCookies } from '../../../../../__mocks__/test-utils-system.js'
import searchResultsMany from '../../../../../services/address-lookup/__mocks__/data/search-results-many'
import searchResultsOne from '../../../../../services/address-lookup/__mocks__/data/search-results-one'
import searchResultsNone from '../../../../../services/address-lookup/__mocks__/data/search-results-none'
import { salesApi } from '@defra-fish/connectors-lib'
import mockDefraCountries from '../../../../../__mocks__/data/defra-country'

beforeAll(() => new Promise(resolve => start(resolve)))
beforeAll(() => new Promise(resolve => initialize(resolve)))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')
salesApi.countries.getAll = jest.fn(async () => new Promise(resolve => resolve(mockDefraCountries)))

describe('The address lookup page', () => {
  it('returns success on requesting', async () => {
    const response = await injectWithCookies('GET', ADDRESS_LOOKUP.uri)
    expect(response.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an empty payload', async () => {
    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, {})
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_LOOKUP.uri}#`)
  })

  it('redirects back to itself on posting an empty premises', async () => {
    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: '', postcode: 'BS9 1HJ' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_LOOKUP.uri}#`)
  })

  it('redirects back to itself on posting an empty postcode', async () => {
    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: '5', postcode: '' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_LOOKUP.uri}#`)
  })

  it('redirects back to itself on posting a bad postcode', async () => {
    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: '5', postcode: 'foo' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_LOOKUP.uri}#`)
  })

  it('redirects back to itself on posting a too long premises', async () => {
    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: 'a'.repeat(101), postcode: 'BS9 1HJ' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_LOOKUP.uri}#`)
  })

  it('on finding list of multiple found addresses redirects to the select page', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'

    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsMany, ok: true })))

    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_SELECT.uri}#`)
  })

  it('on finding list of a single found address redirects to the select page', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'

    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsOne, ok: true })))

    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })

    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_SELECT.uri}#`)
  })

  it("redirects to the entry page where there is no result - and displays the 'not-found' insert text ", async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'

    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsNone, ok: true })))

    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_ENTRY.uri}#`)

    const response2 = await injectWithCookies('GET', ADDRESS_ENTRY.uri)
    expect(response2.payload).toContain('We could not find an address')
  })

  it('redirects to the entry page where there an exception thrown in the address lookup request', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'

    fetch.mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error('Fetch error'))))

    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_ENTRY.uri}#`)
  })

  it('redirects to the entry page where there is no lookup set up', async () => {
    delete process.env.ADDRESS_LOOKUP_URL
    delete process.env.ADDRESS_LOOKUP_KEY
    const response = await injectWithCookies('POST', ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    expect(response.statusCode).toBe(302)
    expect(response.headers.location).toBe(`${ADDRESS_ENTRY.uri}#`)
  })
})
