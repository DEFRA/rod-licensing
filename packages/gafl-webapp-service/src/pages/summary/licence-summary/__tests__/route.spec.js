import { getData } from '../route'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../constants.js'
import findPermit from '../../find-permit.js'
import '../../../../processors/date-and-time-display.js'
import '../../../../processors/concession-helper.js'
import '../../../../processors/licence-type-display.js'

jest.mock('../../find-permit.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/concession-helper.js')
jest.mock('../../../../processors/licence-type-display.js')

describe('licence-summary > route', () => {
  describe('getData', () => {
    beforeEach(jest.clearAllMocks)

    const mockStatusCacheGet = jest.fn()
    const mockStatusCacheSet = jest.fn()
    const mockTransactionCacheGet = jest.fn()

    const mockRequest = {
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: mockStatusCacheGet,
            setCurrentPermission: mockStatusCacheSet
          },
          transaction: {
            getCurrentPermission: mockTransactionCacheGet
          }
        }
      })
    }

    const mockTransaction = {
      licenceStartDate: '2020-12-31',
      numberOfRods: 2,
      licenceType: 'Trout and coarse',
      licenceLength: '1D',
      permit: { cost: 0 },
      licensee: { birthDate: '1946-01-01' }
    }

    it('should set fromSummary to licence-summary, if it is a renewal', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({ permit: { cost: 0 }, licensee: { birthDate: '1946-01-01' } }))
      findPermit.mockResolvedValue()
      await getData(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith(expect.objectContaining({ fromSummary: LICENCE_SUMMARY_SEEN }))
    })

    it('should set fromSummary to licence-summary, if fromSummary has not been set and it is not a renewal', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      mockTransactionCacheGet.mockImplementationOnce(() => mockTransaction)
      findPermit.mockResolvedValue()
      await getData(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith(expect.objectContaining({ fromSummary: LICENCE_SUMMARY_SEEN }))
    })

    it('should set fromSummary to contact-summary, if fromSummary is contact-summary and it is not a renewal', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: CONTACT_SUMMARY_SEEN }))
      mockTransactionCacheGet.mockImplementationOnce(() => mockTransaction)
      findPermit.mockResolvedValue()
      await getData(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith(expect.objectContaining({ fromSummary: CONTACT_SUMMARY_SEEN }))
    })
  })
})
