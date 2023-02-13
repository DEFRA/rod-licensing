import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'
import { licenceToStart } from '../../licence-to-start/update-transaction.js'

describe('licence-length > result-function', () => {
  const mockStatusCacheGet = jest.fn(() => ({}))
  const mockTransactionCacheGet = jest.fn(() => ({}))

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    })
  }

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return SUMMARY if status is from summary', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({
        fromSummary: true
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return OK if status is not from summary and licenceToStart is after payment', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        licenceToStart: licenceToStart.AFTER_PAYMENT
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return OK if status is not from summary and licenceLength is 12 months', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        licenceLength: '12M'
      }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return require-time if status is not from summary, licence does not start after payment and licence length is not 12 months', async () => {
      const result = await resultFunction(mockRequest)
      expect(result).toBe('require-time')
    })
  })
})
