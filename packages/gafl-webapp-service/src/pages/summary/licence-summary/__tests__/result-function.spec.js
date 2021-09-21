import resultFunction from '../result-function'
import { CommonResults, ShowDigitalLicencePages } from '../../../../constants.js'

describe('licence-summary > result-function', () => {
  const mockStatusCacheGet = jest.fn()
  const mockTransactionPageGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        transaction: {
          getCurrentPermission: mockTransactionPageGet
        }
      }
    })
  }

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return the digital licence screen, if licence is in renewal, is 12 months and showDigitalLicencePages is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true, showDigitalLicencePages: true }))
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          postalFulfilment: true
        }
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(ShowDigitalLicencePages.YES)
    })

    it('should return the summary screen, if licence is in renewal, is 12 months and showDigitalLicencePages is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true, showDigitalLicencePages: false }))
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          postalFulfilment: false
        }
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok, if licence is 12 months and showDigitalLicencePages is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ showDigitalLicencePages: true }))
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          postalFulfilment: true
        }
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return summary if from summary', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true }))
      mockTransactionPageGet.mockImplementationOnce(() => ({}))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
