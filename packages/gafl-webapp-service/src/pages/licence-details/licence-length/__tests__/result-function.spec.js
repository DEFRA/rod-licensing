import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'
import { licenceToStart } from '../../licence-to-start/update-transaction.js'

describe('licence-length > result-function', () => {
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

    it('should return SUMMARY if status is from summary', async () => {
      const request = getMockRequest({ fromSummary: true })
      const result = await resultFunction(request)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return OK if status is not from summary and licenceToStart is after payment', async () => {
      const request = getMockRequest({ fromSummary: false }, { licenceToStart: licenceToStart.AFTER_PAYMENT })
      const result = await resultFunction(request)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return OK if status is not from summary and licenceLength is 12 months', async () => {
      const request = getMockRequest({ fromSummary: false }, { licenceLength: '12M' })
      const result = await resultFunction(request)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return require-time if status is not from summary, licence does not start after payment and licence length is not 12 months', async () => {
      const request = getMockRequest({ fromSummary: false }, { licenceLength: '1D', licenceToStart: licenceToStart.ANOTHER_DATE })
      const result = await resultFunction(request)
      expect(result).toBe('require-time')
    })
  })
})
