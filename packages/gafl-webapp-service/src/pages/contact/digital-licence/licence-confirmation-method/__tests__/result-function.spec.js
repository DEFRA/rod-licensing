import resultFunction from '../result-function'
import { CommonResults } from '../../../../../constants.js'

describe('newsletter > result-function', () => {
  const getMockRequest = (summary, fromContactDetailsSeen = 'not-seen') => ({
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

    it('should return amend if contact details have been seen', async () => {
      const fromContactDetailsSeen = 'seen'
      const result = await resultFunction(getMockRequest('summary', fromContactDetailsSeen))
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return summary if contact details havent been seen but its returning from the contact summary', async () => {
      const summary = 'contact-summary'
      const result = await resultFunction(getMockRequest(summary))
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if contact details havent been seen, its not returning from the contact summary and its not a renewal', async () => {
      const summary = 'not-contact-summary'
      const result = await resultFunction(getMockRequest(summary))
      expect(result).toBe(CommonResults.OK)
    })
  })
})
