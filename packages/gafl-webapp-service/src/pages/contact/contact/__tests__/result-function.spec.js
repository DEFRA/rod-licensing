import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

describe('contact > result-function', () => {
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        }
      }
    })
  }

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return ok if isLicenceForYou is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return summary if isLicenceForYou is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })
  })
})
