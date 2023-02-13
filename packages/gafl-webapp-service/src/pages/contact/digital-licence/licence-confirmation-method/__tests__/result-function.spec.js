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

    it('should return amend if contact details have been seen', async () => {
      const result = await resultFunction(getMockRequest('seen'))
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return summary if contact details havent been seen but its returning from the contact summary', async () => {
      const result = await resultFunction(getMockRequest('not-seen', 'contact-summary'))
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if contact details havent been seen, its not returning from the contact summary and its not a renewal', async () => {
      const result = await resultFunction(getMockRequest('not-seen', 'not-contact-summary'))
      expect(result).toBe(CommonResults.OK)
    })
  })
})
