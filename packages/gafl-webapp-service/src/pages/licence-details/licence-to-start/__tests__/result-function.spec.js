import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'
import { ageConcessionResults } from '../../../concessions/date-of-birth/result-function.js'
import { licenceToStart } from '../update-transaction.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

describe('licence-to-start > result-function', () => {
  const mockStatusCacheGet = jest.fn()
  const mockTransactionCacheGet = jest.fn()

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

    it('should return summary if fromSummary is true', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceToStart: licenceToStart.ANOTHER_DATE, licenceLength: '12M' }))
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.SUMMARY)
    })

    it('should return ok if fromSummary is false', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: false }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceToStart: licenceToStart.ANOTHER_DATE, licenceLength: '12M' }))
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(CommonResults.OK)
    })

    it('should return licenceToStartResults.AND_START_TIME if not 12 months lenghts and licence to start is another date', async () => {
      const licenceToStartResults = {
        AND_START_TIME: 'and-start-time'
      }
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceToStart: licenceToStart.ANOTHER_DATE, licenceLength: '8D' }))
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(licenceToStartResults.AND_START_TIME)
    })

    it('should return ageConcessionResults.NO_LICENCE_REQUIRED if no licence is required', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: { noLicenceRequired: true } }))
      isMultibuyForYou.mockImplementationOnce(() => false)
      const result = await resultFunction(mockRequest)
      expect(result).toBe(ageConcessionResults.NO_LICENCE_REQUIRED)
    })
  })
})
