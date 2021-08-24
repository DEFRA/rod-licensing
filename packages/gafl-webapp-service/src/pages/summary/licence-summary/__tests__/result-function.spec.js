import resultFunction from '../result-function'
import { CONTACT_SUMMARY_SEEN, CommonResults, showDigitalLicencePages } from '../../../../constants.js'

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

    it('should return the digital licence screen, if licence is in renewal, is 12 months and postal fulfilment is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({renewal: true}))
      mockTransactionPageGet.mockImplementationOnce(() => ({
        licenceLength: '12M',
        licensee: {
          postalFulfilment: true
        }
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(showDigitalLicencePages.YES)
    })

    it('should return ok, if licence is 12 months and postal fulfilment is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
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
      mockStatusCacheGet.mockImplementationOnce(() => ({fromSummary: true}))
      mockTransactionPageGet.mockImplementationOnce(() => ({}))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })
  })
})
