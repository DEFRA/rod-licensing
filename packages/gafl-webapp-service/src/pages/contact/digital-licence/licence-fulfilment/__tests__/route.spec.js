import { getData } from '../route'
import { CONTACT } from '../../../../../uri'
import GetDataRedirect from '../../../../../handlers/get-data-redirect'

describe('licence-fulfilment > route', () => {
  const mockStatusCacheGet = jest.fn()
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        },
        status: {
          getCurrentPermission: mockStatusCacheGet
        }
      }
    })
  }

  describe('getData', () => {
    beforeEach(jest.clearAllMocks)

    it('should throw an error if the licence is not 12M', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceLength: '1D' }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const func = async () => await getData(mockRequest)
      await expect(func).rejects.toThrow(new GetDataRedirect(CONTACT.uri))
    })
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the status cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceLength: '12M' }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as true, if isLicenceForYou is true on the status cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceLength: '12M' }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })
})
