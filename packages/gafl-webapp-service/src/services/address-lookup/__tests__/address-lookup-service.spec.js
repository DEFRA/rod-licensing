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

    it.each([
      ['1 HOWECROFT COURT, EASTMEAD LANE, BRISTOL, BS9 1HJ', 'BS9 1HJ', '1 howecroft court, eastmead lane, bristol, BS9 1HJ', 'BS9 1HJ'],
      ['9 ORBIT STREET, ADAMSDOWN, CARDIfF, CF24 0JX', 'CF24 0JX', '9 orbit street, adamsdown, cardiff, CF24 0JX', 'CF24 0JX'],
      ['45 TINTERN CLOSE, EASTBOURNE, BN22 0UF', 'BN22 0UF', '45 tintern close, eastbourne, BN22 0UF', 'BN22 0UF']
    ])('if data is returned from the API, it maps the data correctly in lower case, other than postcode', async (address, postcode, expectedAddress, expectedPostcode) => {
      fetch.mockResolvedValue({
        json: () => ({
          results: [{
            address: address,
            postcode: postcode
          }]
        })
      })
      const results = await als()
      expect(results[0]).toEqual(expect.objectContaining({
        address: expectedAddress,
        postcode: expectedPostcode
      }))
    })
  })
})
