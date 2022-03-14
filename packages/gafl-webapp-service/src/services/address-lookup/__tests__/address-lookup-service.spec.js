import als, { capitalise, formatAddress } from '../address-lookup-service.js'
import fetch from 'node-fetch'

jest.mock('node-fetch')

describe('address-lookup-service', () => {
  beforeAll(() => {
    process.env.ADDRESS_LOOKUP_KEY = 'ADDRESS_LOOKUP_KEY'
    process.env.ADDRESS_LOOKUP_URL = 'https://address.lookup.url'
  })
  beforeEach(jest.clearAllMocks)

  describe('default', () => {
    it('returns empty array if results node is missing', async () => {
      fetch.mockResolvedValue({ json: () => Promise.resolve({}) })
      const results = await als()
      expect(results).toEqual([])
    })

    it('if data is returned from the API, it maps the data correctly', async () => {
      fetch.mockResolvedValue({
        json: () => ({
          results: [{
            address: '1 HOWECROFT COURT, EASTMEAD LANE, BRISTOL',
            premises: '1',
            street_address: 'HOWECROFT COURT',
            locality: 'EASTMEAD LANE',
            city: 'BRISTOL',
            postcode: 'BS9 1HJ'
          }]
        })
      })
      const results = await als()
      expect(results).toStrictEqual([
        {
          id: 0,
          address: '1 HOWECROFT COURT, EASTMEAD LANE, BRISTOL',
          premises: '1',
          street: 'HOWECROFT COURT',
          locality: 'EASTMEAD LANE',
          town: 'BRISTOL',
          postcode: 'BS9 1HJ',
          country: undefined,
          address_full: '1 Howecroft Court, Eastmead Lane, Bristol, BS9 1HJ'
        }
      ])
    })
  })

  describe('capitalise', () => {
    it('returns the full address with capitalised formatting when uppercase', async () => {
      const addressFull = '1 HOWECROFT COURT, EASTMEAD LANE, BRISTOL'
      expect(capitalise(addressFull)).toEqual('1 Howecroft Court, Eastmead Lane, Bristol')
    })

    it('returns the full address with capitalised formatting when lowercase', async () => {
      const addressFull = '1 howecroft court, eastmead lane, bristol'
      expect(capitalise(addressFull)).toEqual('1 Howecroft Court, Eastmead Lane, Bristol')
    })

    it('returns null if undefined is passed', async () => {
      const addressFull = undefined
      expect(capitalise(addressFull)).toEqual(null)
    })

    it('returns null if null is passed ', async () => {
      const addressFull = null
      expect(capitalise(addressFull)).toEqual(null)
    })
  })

  describe('formatAddress', () => {
    it('returns the full address with capitalised formatting, except the postcode which is all capitals', async () => {
      const premises = '1'
      const streetAddress = 'Howecroft Court'
      const locality = 'Eastmead Lane'
      const city = 'Bristol'
      const postcode = 'BS9 1HJ'
      expect(formatAddress(premises, streetAddress, locality, city, postcode)).toEqual('1 Howecroft Court, Eastmead Lane, Bristol, BS9 1HJ')
    })

    it('returns the full address with capitalised formatting, if everything entered is all uppercase', async () => {
      const premises = '1'
      const streetAddress = 'HOWECROFT COURT'
      const locality = 'EASTMEAD LANE'
      const city = 'BRISTOL'
      const postcode = 'BS9 1HJ'
      expect(formatAddress(premises, streetAddress, locality, city, postcode)).toEqual('1 Howecroft Court, Eastmead Lane, Bristol, BS9 1HJ')
    })

    it('if locality is undefined it should not be in the address', async () => {
      const premises = '1'
      const streetAddress = 'HOWECROFT COURT'
      const locality = undefined
      const city = 'BRISTOL'
      const postcode = 'BS9 1HJ'
      expect(formatAddress(premises, streetAddress, locality, city, postcode)).toEqual('1 Howecroft Court, Bristol, BS9 1HJ')
    })
  })
})
