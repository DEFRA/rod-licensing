import { getData } from '../route'
import '../../../../processors/pricing-summary.js'
import '../../../../processors/licence-type-display.js'

jest.mock('../../../../processors/pricing-summary.js')
jest.mock('../../../../processors/licence-type-display.js')

describe('licence-length > route', () => {
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        transaction: {
          getCurrentPermission: jest.fn()
        }
      }
    })
  }

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })
})
