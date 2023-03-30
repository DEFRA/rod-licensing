import resultFunction from '../result-function'
import { CommonResults, MultibuyForYou, ShowDigitalLicencePages } from '../../../../constants.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'
import { isPhysical } from '../../../../processors/licence-type-display'

jest.mock('../../../../processors/licence-type-display.js')

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

const getMockRequest = (mockStatus, mockPermissions) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: jest.fn(() => ({
          ...mockStatus
        }))
      },
      transaction: {
        getCurrentPermission: jest.fn(() => ({
          ...mockPermissions
        }))
      }
    }
  })
})

describe('change-contact-details > result-function', () => {
  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return the digital licence screen, if licence is in renewal, is 12 months and showDigitalLicencePages is true', async () => {
      isPhysical.mockReturnValue(true)
      const mockStatus = { renewal: true, showDigitalLicencePages: true }
      const mockTransaction = {
        licenceLength: '12M',
        licensee: {
          postalFulfilment: true
        }
      }
      const mockRequest = getMockRequest(mockStatus, mockTransaction)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(ShowDigitalLicencePages.YES)
    })

    it('should return the summary screen, if licence is in renewal, is 12 months and showDigitalLicencePages is false', async () => {
      const mockStatus = { renewal: true, showDigitalLicencePages: false }
      const mockTransaction = {
        licenceLength: '12M',
        licensee: {
          postalFulfilment: false
        }
      }
      const mockRequest = getMockRequest(mockStatus, mockTransaction)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok, if licence is 12 months and showDigitalLicencePages is true', async () => {
      const mockStatus = { showDigitalLicencePages: true }
      const mockTransaction = {
        licenceLength: '12M',
        licensee: {
          postalFulfilment: true
        }
      }
      isMultibuyForYou.mockImplementationOnce(() => false)
      const mockRequest = getMockRequest(mockStatus, mockTransaction)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return amend if fromContactDetails is seen', async () => {
      const mockStatus = { fromContactDetailsSeen: 'seen' }
      const mockRequest = getMockRequest(mockStatus)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.AMEND)
    })

    it('should return ok if fromChangeLicenceOptions is not seen', async () => {
      const mockStatus = { fromContactDetailsSeen: 'details' }
      const mockRequest = getMockRequest(mockStatus)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return isMultibuyForYou when is true', async () => {
      const mockStatus = { renewal: false }
      isMultibuyForYou.mockImplementationOnce(() => true)
      const mockRequest = getMockRequest(mockStatus)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(MultibuyForYou.YES)
    })

    it('should not return isMultibuyForYou when is false', async () => {
      const mockStatus = { renewal: false }
      isMultibuyForYou.mockImplementationOnce(() => false)
      const mockRequest = getMockRequest(mockStatus)
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(MultibuyForYou.YES)
    })
  })
})
