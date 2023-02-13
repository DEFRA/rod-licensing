import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

describe('contact > result-function', () => {
  const mockStatusCacheGet = jest.fn(() => ({}))

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

    it('should return SUMMARY if status is from summary', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({
        fromSummary: true
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return OK if status is not from summary', async () => {
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
