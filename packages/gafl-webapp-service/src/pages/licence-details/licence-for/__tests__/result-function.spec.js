import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

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
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if fromSummary is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
