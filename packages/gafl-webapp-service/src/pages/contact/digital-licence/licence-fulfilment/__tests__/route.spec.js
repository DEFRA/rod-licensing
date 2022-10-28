import { getData } from '../route'
import { CONTACT } from '../../../../../uri'

describe('licence-fulfilment > route', () => {
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
    beforeEach(jest.clearAllMocks)

    it('should throw an error if the licence is not 12M', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceLength: '1D' }))
      const func = async () => await getData(mockRequest)
      await expect(func).rejects.toThrowRedirectTo(CONTACT.uri)
    })
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceLength: '12M', isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceLength: '12M', isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })
})
