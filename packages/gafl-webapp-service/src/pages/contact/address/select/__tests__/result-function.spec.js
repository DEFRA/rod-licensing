import resultFunction from '../result-function'
import { CommonResults, ShowDigitalLicencePages, CHANGE_CONTACT_DETAILS_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../../constants.js'
import { isPhysical } from '../../../../../processors/licence-type-display.js'

jest.mock('../../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))

describe('result function', () => {
  const getMockRequest = statusPermission => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: () => statusPermission
        },
        transaction: {
          getCurrentPermission: jest.fn()
        }
      }
    })
  })
  beforeEach(jest.clearAllMocks)

  it('should return amend if status.fromContactDetailsSeen equals seen', async () => {
    const request = getMockRequest({ fromSummary: CONTACT_SUMMARY_SEEN, fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.SEEN })
    const result = await resultFunction(request)
    expect(result).toBe(CommonResults.AMEND)
  })

  it('should return summary if status.fromContactDetailsSeen does not equal seen and status.fromSummary equals contact-summary', async () => {
    const request = getMockRequest({ fromSummary: CONTACT_SUMMARY_SEEN, fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.NOT_SEEN })
    const result = await resultFunction(request)
    expect(result).toBe(CommonResults.SUMMARY)
  })

  it('should return ShowDigitalLicencePages.YES if status.fromContactDetailsSeen does not equal seen, status.fromSummary does not equal contact-summary and isPhysical is true', async () => {
    isPhysical.mockReturnValueOnce(true)
    const request = getMockRequest({ fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.NOT_SEEN })
    const result = await resultFunction(request)
    expect(result).toBe(ShowDigitalLicencePages.YES)
  })

  it('should return ShowDigitalLicencePages.YES if status.fromContactDetailsSeen does not equal seen, status.fromSummary does not equal contact-summary and isPhysical is false', async () => {
    isPhysical.mockReturnValueOnce(false)
    const request = getMockRequest({ fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.NOT_SEEN })
    const result = await resultFunction(request)
    expect(result).toBe(ShowDigitalLicencePages.NO)
  })
})
