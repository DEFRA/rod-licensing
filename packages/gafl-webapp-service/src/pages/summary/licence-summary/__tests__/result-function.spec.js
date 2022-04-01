import resultFunction from '../result-function'
import { CommonResults, ShowDigitalLicencePages, MultibuyForYou } from '../../../../constants.js'

describe('licence-summary > result-function', () => {
  const mockStatusCacheGet = jest.fn()
  const mockTransactionPageGet = jest.fn()
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        transaction: {
          getCurrentPermission: mockTransactionPageGet,
          get: mockTransactionCacheGet
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
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0 } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return summary if from summary', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true }))
      mockTransactionPageGet.mockImplementationOnce(() => ({}))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0 } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it.each([[3], [4], [5]])('should return LICENCE_FULFILMENT if multibuy and licence is for you', async length => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: length, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(MultibuyForYou.YES)
    })

    it('should not return isMultibuyForYou when licence is for someone else', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 3, isLicenceForYou: false } }))
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(MultibuyForYou.YES)
    })

    it('should not return isMultibuyForYou when isnt licence in basket', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permissions: { length: 0, isLicenceForYou: true } }))
      const result = await resultFunction(mockRequest)
      expect(result).not.toBe(MultibuyForYou.YES)
    })
  })
})
