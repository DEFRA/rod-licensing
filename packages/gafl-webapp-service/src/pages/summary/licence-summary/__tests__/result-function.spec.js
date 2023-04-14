import resultFunction from '../result-function'
import { CommonResults, ShowDigitalLicencePages } from '../../../../constants.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'
jest.mock('../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))

describe('licence-summary > result-function', () => {
  const getMockRequest = (statusPermission = {}, transactionPermission = {}) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: () => statusPermission
        },
        transaction: {
          getCurrentPermission: () => transactionPermission
        }
      }
    })
  })

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return the digital licence screen, if licence is in renewal, is physical and showDigitalLicencePages is true', async () => {
      const statusPermission = { showDigitalLicencePages: true }
      const transactionPermission = {
        isRenewal: true,
        licensee: {
          postalFulfilment: true
        }
      }
      const result = await resultFunction(getMockRequest(statusPermission, transactionPermission))
      expect(result).toBe(ShowDigitalLicencePages.YES)
    })

    it('should return the summary screen, if licence is in renewal and is not physical', async () => {
      isPhysical.mockReturnValueOnce(false)
      const statusPermission = { showDigitalLicencePages: true }
      const transactionPermission = {
        isRenewal: true
      }
      const result = await resultFunction(getMockRequest(statusPermission, transactionPermission))
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return the summary screen, if licence is in renewal, is physical and showDigitalLicencePages is false', async () => {
      const statusPermission = { showDigitalLicencePages: false }
      const transactionPermission = {
        isRenewal: true,
        licensee: {
          postalFulfilment: false
        }
      }
      const result = await resultFunction(getMockRequest(statusPermission, transactionPermission))
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok, if licence is physical and showDigitalLicencePages is true', async () => {
      const statusPermission = { showDigitalLicencePages: true }
      const transactionPermission = {
        licensee: {
          postalFulfilment: true
        }
      }
      const result = await resultFunction(getMockRequest(statusPermission, transactionPermission))
      expect(result).toBe(CommonResults.OK)
    })

    it('should return summary if from summary', async () => {
      const statusPermission = { fromSummary: true }
      const result = await resultFunction(getMockRequest(statusPermission))
      expect(result).toBe(CommonResults.OK)
    })
  })
})
