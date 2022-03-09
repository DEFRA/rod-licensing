import als, { capitalise, formatAddress } from '../address-lookup-service.js'
import fetch from 'node-fetch'
import searchResultsOne from '../__mocks__/data/search-results-one'

jest.mock('node-fetch')

describe('Address lookup service', () => {
  beforeAll(() => {
    process.env.ADDRESS_LOOKUP_KEY = 'ADDRESS_LOOKUP_KEY'
    process.env.ADDRESS_LOOKUP_URL = 'https://address.lookup.url'
  })

  it('returns empty array if results node is missing', async () => {
    fetch.mockResolvedValue({ json: () => Promise.resolve({}) })
    const results = await als()
    expect(results).toEqual([])
  })

  it('returns the full address with capitalised formatting', async () => {
    const addressFull = searchResultsOne.results[0].address
    expect(capitalise(addressFull)).toEqual('1 Howecroft Court, Eastmead Lane, Bristol, Bs9 1hj')
  })

  it('returns the full address with capitalised formatting, except the postcode which is all caps', async () => {
    const premises = searchResultsOne.results[0].premises
    const streetAddress = searchResultsOne.results[0].street_address
    const locality = searchResultsOne.results[0].locality
    const city = searchResultsOne.results[0].city
    const postcode = searchResultsOne.results[0].postcode
    expect(formatAddress(premises, streetAddress, locality, city, postcode)).toEqual('1 Howecroft Court Eastmead Lane, Bristol, BS9 1HJ')
  })
})
