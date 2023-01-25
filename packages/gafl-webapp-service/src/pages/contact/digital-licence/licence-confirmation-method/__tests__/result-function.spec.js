import resultFunction from '../result-function'
import { CommonResults } from '../../../../../constants.js'

describe('newsletter > result-function', () => {
  const getMockRequest = (fromContactDetailsSeen, summary) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: async () => ({
            fromContactDetailsSeen: fromContactDetailsSeen,
            fromSummary: summary
          })
        }
      }
    })
  })

  describe('result function', () => {
    beforeEach(jest.clearAllMocks)

    it('should return amend if status.fromContactDetailsSeen equals seen', async () => {
      const result = await resultFunction(getMockRequest('seen'))
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return summary if status.fromContactDetailsSeen does not equal seen and status.fromSummary equals contact-summary', async () => {
      const result = await resultFunction(getMockRequest('not-seen', 'contact-summary'))
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if status.fromContactDetailsSeen does not equal seen and status.fromSummary does not equal contact-summary', async () => {
      const result = await resultFunction(getMockRequest('not-seen', 'not-contact-summary'))
      expect(result).toBe(CommonResults.OK)
    })
  })
})
