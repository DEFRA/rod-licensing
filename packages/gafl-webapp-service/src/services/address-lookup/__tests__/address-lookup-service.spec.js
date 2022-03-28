import als from '../address-lookup-service.js'
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
            address: '1 HOWECROFT COURT, EASTMEAD LANE, BRISTOL, BS9 1HJ',
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
          address: '1 howecroft court, eastmead lane, bristol, BS9 1HJ',
          premises: '1',
          street: 'HOWECROFT COURT',
          locality: 'EASTMEAD LANE',
          town: 'BRISTOL',
          postcode: 'BS9 1HJ',
          country: undefined
        }
      ])
    })
  })
})
