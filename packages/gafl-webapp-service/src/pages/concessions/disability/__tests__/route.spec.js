import { getData } from '../route'

describe('disability > route', () => {
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
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ concessions: [], isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ concessions: [], isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })
})
