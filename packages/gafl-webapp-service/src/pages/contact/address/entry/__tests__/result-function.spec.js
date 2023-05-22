import resultFunction from '../result-function'
import { CONTACT_SUMMARY_SEEN, CommonResults, ShowDigitalLicencePages } from '../../../../../constants.js'
import { isPhysical } from '../../../../../processors/licence-type-display.js'

jest.mock('../../../../../processors/licence-type-display.js')

describe('contact > address > entry > result-function', () => {
  const getMockRequest = (statusPermission = {}) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: () => statusPermission
        },
        transaction: {
          getCurrentPermission: () => {}
        }
      }
    })
  })

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return CommonResults.SUMMARY if fromSummary is set to CONTACT_SUMMARY_SEEN', async () => {
      const request = getMockRequest({ fromSummary: CONTACT_SUMMARY_SEEN })
      const result = await resultFunction(request)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ShowDigitalLicencePages.YES if fromSummary is not set to CONTACT_SUMMARY_SEEN and the permit is physical', async () => {
      isPhysical.mockReturnValueOnce(true)
      const result = await resultFunction(getMockRequest())
      expect(result).toBe(ShowDigitalLicencePages.YES)
    })

    it('should return ShowDigitalLicencePages.NO if fromSummary is not set to CONTACT_SUMMARY_SEEN and the permit is not physical', async () => {
      isPhysical.mockReturnValueOnce(false)
      const result = await resultFunction(getMockRequest())
      expect(result).toBe(ShowDigitalLicencePages.NO)
    })
  })
})
