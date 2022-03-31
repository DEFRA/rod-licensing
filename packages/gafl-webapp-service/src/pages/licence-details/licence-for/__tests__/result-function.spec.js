import resultFunction from '../result-function'
import { CommonResults, Multibuy } from '../../../../constants.js'

describe('licence-for > result-function', () => {
  const mockStatusCacheGet = jest.fn()
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        transaction: {
          get: mockTransactionCacheGet
        }
      }
    })
  }

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return summary if fromSummary is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if fromSummary is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return when licence to start if multibuy and licence is for you', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 3, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(Multibuy.YES)
    })

    it('should not return isMultibuyForYou when licence is for someone else', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 3, isLicenceForYou: false } }))
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(Multibuy.YES)
    })

    it('should not return isMultibuyForYou when isnt licence in basket', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(Multibuy.YES)
    })
  })
})
