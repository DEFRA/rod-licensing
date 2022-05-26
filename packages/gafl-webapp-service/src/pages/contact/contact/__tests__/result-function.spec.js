import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

describe('contact > result-function', () => {
  const mockStatusCacheGet = jest.fn(() => ({}))
  const mockTransactionCacheGet = jest.fn(() => ({}))

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    })
  }

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return ok if isLicenceForYou is true', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return summary if isLicenceForYou is false', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if fromSummary is licence-summary', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: 'licence-summary' }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return summary if fromSummary is contact-summary', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: 'contact-summary' }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if renewal is false', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isRenewal: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return summary if renewal is true', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isRenewal: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })
  })
})
