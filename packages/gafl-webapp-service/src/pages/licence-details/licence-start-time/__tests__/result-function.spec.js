import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

describe('contact > result-function', () => {
  const getMockRequest = (statusPermission = {}) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: () => statusPermission
        }
      }
    })
  })

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return SUMMARY if status is from summary', async () => {
      const request = getMockRequest({ fromSummary: true })
      const result = await resultFunction(request)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return OK if status is not from summary', async () => {
      const request = getMockRequest({ fromSummary: false })
      const result = await resultFunction(request)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
