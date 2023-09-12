import resultFunction from '../result-function'
import { CONTACT_SUMMARY_SEEN, CommonResults, ShowDigitalLicencePages, CHANGE_CONTACT_DETAILS_SEEN } from '../../../../../constants.js'
import { isPhysical } from '../../../../../processors/licence-type-display.js'

jest.mock('../../../../../processors/licence-type-display.js')

describe('result-function', () => {
  const getMockRequest = statusPermission => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: async () => statusPermission
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

  it('should return CommonResults.SUMMARY if fromSummary is set to CONTACT_SUMMARY_SEEN', async () => {
    const request = getMockRequest({ fromSummary: CONTACT_SUMMARY_SEEN, fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.NOT_SEEN })
    const result = await resultFunction(request)
    expect(result).toBe(CommonResults.SUMMARY)
  })

  it('should return ShowDigitalLicencePages.YES if fromSummary is not set to CONTACT_SUMMARY_SEEN and the permit is physical', async () => {
    isPhysical.mockReturnValueOnce(true)
    const request = getMockRequest({ fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.NOT_SEEN })
    const result = await resultFunction(request)
    expect(result).toBe(ShowDigitalLicencePages.YES)
  })

  it('should return ShowDigitalLicencePages.NO if fromSummary is not set to CONTACT_SUMMARY_SEEN and the permit is not physical', async () => {
    isPhysical.mockReturnValueOnce(false)
    const request = getMockRequest({ fromContactDetailsSeen: CHANGE_CONTACT_DETAILS_SEEN.NOT_SEEN })
    const result = await resultFunction(request)
    expect(result).toBe(ShowDigitalLicencePages.NO)
  })
})
