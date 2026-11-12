import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

describe('has-licence > result-function', () => {
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

    it('should return ok', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
