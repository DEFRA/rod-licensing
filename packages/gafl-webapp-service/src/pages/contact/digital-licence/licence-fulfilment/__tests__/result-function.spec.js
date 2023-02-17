import resultFunction from '../result-function.js'
import { CommonResults, MultibuyForYou } from '../../../../../constants.js'
import { isMultibuyForYou } from '../../../../../handlers/multibuy-for-you-handler.js'

jest.mock('../../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

describe('licence-for > result-function', () => {
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

    it('should return summary if fromSummary is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: 'contact-summary', CONTACT_SUMMARY_SEEN: 'contact-summary' }))
      isMultibuyForYou.mockImplementationOnce(() => false)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if fromSummary is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: 'not-contact-summary', CONTACT_SUMMARY_SEEN: 'contact-summary' }))
      isMultibuyForYou.mockImplementationOnce(() => false)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return isMultibuyForYou when is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: 'not-contact-summary', CONTACT_SUMMARY_SEEN: 'contact-summary' }))
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(MultibuyForYou.YES)
    })

    it('should not return isMultibuyForYou when is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      isMultibuyForYou.mockImplementationOnce(() => false)
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(MultibuyForYou.YES)
    })

    it('should return amend if status.fromContactDetailsSeen equals seen', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromContactDetailsSeen: 'seen' }))
      isMultibuyForYou.mockImplementationOnce(() => false)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })
  })
})
