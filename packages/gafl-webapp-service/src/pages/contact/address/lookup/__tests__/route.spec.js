import { getData } from '../route'

describe('address-lookup > route', () => {
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    })
  }

  describe('getData', () => {
    it('should return pronoun as your, if isLicenceForYou is true on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ concessions: [], isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toBe('your')
    })

    it('should return pronoun as their, if isLicenceForYou is false on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ concessions: [], isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toBe('their')
    })
  })
})
