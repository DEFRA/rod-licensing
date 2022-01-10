import { getData } from '../route'

describe('address-select > route', () => {
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        },
        addressLookup: {
          getCurrentPermission: jest.fn(() => ({}))
        }
      }
    })
  }

  describe('getData', () => {
    it('should return pronoun as your, if isLicenceForYou is true on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toBe('your')
    })

    it('should return pronoun as their, if isLicenceForYou is false on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toBe('their')
    })
  })
})
