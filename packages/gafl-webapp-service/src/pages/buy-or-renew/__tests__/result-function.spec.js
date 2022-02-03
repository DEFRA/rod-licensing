import resultFunction, { buyNewLicence } from '../result-function'
import { CommonResults } from '../../../constants.js'

describe('buy-or-renew > result-function', () => {
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

    it('should return buy if buyNewLicence is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ buyNewLicence: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return renew if buyNewLicence is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ buyNewLicence: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(buyNewLicence.RENEW)
    })

    it('should return summary if fromSummary is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true, buyNewLicence: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if fromSummary is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false, buyNewLicence: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
