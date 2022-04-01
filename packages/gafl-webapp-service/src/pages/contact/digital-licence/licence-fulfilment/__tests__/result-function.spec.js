import resultFunction from '../result-function.js'
import { CommonResults, MultibuyForYou } from '../../../../../constants.js'

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
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: 'contact-summary', CONTACT_SUMMARY_SEEN: 'contact-summary' }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if fromSummary is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: 'not-contact-summary', CONTACT_SUMMARY_SEEN: 'contact-summary' }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it.each([[3], [4], [5]])('should return contact summary if multibuy and licence is for you', async length => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: length, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(MultibuyForYou.YES)
    })

    it('should not return isMultibuyForYou when licence is for someone else', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 3, isLicenceForYou: false } }))
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(MultibuyForYou.YES)
    })

    it('should not return isMultibuyForYou when isnt licence in basket', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(MultibuyForYou.YES)
    })
  })
})
