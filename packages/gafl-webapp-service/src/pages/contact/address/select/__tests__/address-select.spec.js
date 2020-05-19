import { ADDRESS_SELECT, CONTACT, ADDRESS_LOOKUP, TEST_TRANSACTION } from '../../../../../uri.js'
import { start, stop, initialize, injectWithCookies, postRedirectGet } from '../../../../../__mocks__/test-utils.js'
import searchResultsMany from '../../../../../services/address-lookup/__mocks__/data/search-results-many'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The address select page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookies('GET', ADDRESS_SELECT.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting an empty payload', async () => {
    const data = await injectWithCookies('POST', ADDRESS_SELECT.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_SELECT.uri)
  })

  it('redirects back to itself on posting an no address', async () => {
    const data = await injectWithCookies('POST', ADDRESS_SELECT.uri, { address: '' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_SELECT.uri)
  })

  it('the controller redirects to the contact page after success', async () => {
    process.env.ADDRESS_LOOKUP_URL = 'http://localhost:9002'
    process.env.ADDRESS_LOOKUP_KEY = 'bar'

    fetch.mockImplementationOnce(async () => new Promise(resolve => resolve({ json: () => searchResultsMany, ok: true })))

    await postRedirectGet(ADDRESS_LOOKUP.uri, { premises: 'Howecroft Court', postcode: 'BS9 1HJ' })
    await injectWithCookies('GET', ADDRESS_SELECT.uri)
    const data = await postRedirectGet(ADDRESS_SELECT.uri, { address: '5' })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('The contact information has been set in the transaction', async () => {
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee).toEqual({
      premises: '14 HOWECROFT COURT',
      street: 'EASTMEAD LANE',
      town: 'BRISTOL',
      postcode: 'BS9 1HJ',
      countryCode: 'GB'
    })
  })

  it('Select and address with no street', async () => {
    await postRedirectGet(ADDRESS_SELECT.uri, { address: '6' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee).toEqual({
      premises: '15 HOWECROFT COURT',
      town: 'BRISTOL',
      postcode: 'BS9 1HJ',
      countryCode: 'GB'
    })
  })

  it('Select and address with a locality', async () => {
    await postRedirectGet(ADDRESS_SELECT.uri, { address: '7' })
    const { payload } = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).permissions[0].licensee).toEqual({
      premises: '16 HOWECROFT COURT',
      street: 'EASTMEAD LANE',
      locality: 'Sneyd Park',
      town: 'BRISTOL',
      postcode: 'BS9 1HJ',
      countryCode: 'GB'
    })
  })
})
