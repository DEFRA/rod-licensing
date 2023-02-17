import resultFunction from '../result-function'
import { CommonResults, ShowDigitalLicencePages } from '../../../../../constants.js'
import { isPhysical } from '../../../../../processors/licence-type-display.js'

jest.mock('../../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))

describe('newsletter > result-function', () => {
  const getMockRequest = (fromContactDetailsSeen, summary) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: async () => ({
            fromContactDetailsSeen: fromContactDetailsSeen,
            fromSummary: summary
          })
        },
        transaction: {
          getCurrentPermission: jest.fn()
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

    it('should return ShowDigitalLicencePages.YES if status.fromContactDetailsSeen does not equal seen, status.fromSummary does not equal contact-summary and isPhysical is true', async () => {
      isPhysical.mockReturnValueOnce(true)
      const result = await resultFunction(getMockRequest('not-seen', 'not-contact-summary'))
      expect(result).toBe(ShowDigitalLicencePages.YES)
    })

    it('should return ShowDigitalLicencePages.YES if status.fromContactDetailsSeen does not equal seen, status.fromSummary does not equal contact-summary and isPhysical is false', async () => {
      isPhysical.mockReturnValueOnce(false)
      const result = await resultFunction(getMockRequest('not-seen', 'not-contact-summary'))
      expect(result).toBe(ShowDigitalLicencePages.NO)
    })
  })
})
