import updateTransaction from '../update-transaction'
import { LICENCE_FULFILMENT } from '../../../../uri.js'

describe('licence-detais > update-transaction', () => {
  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    const mockPageCacheGet = jest.fn()
    const mockStatusCacheGet = jest.fn()
    const mockStatusCacheSet = jest.fn()
    const mockTransactionPageGet = jest.fn()
    const mockTransactionPageSet = jest.fn()

    const mockRequest = {
      cache: () => ({
        helpers: {
          page: {
            getCurrentPermission: mockPageCacheGet
          },
          status: {
            getCurrentPermission: mockStatusCacheGet,
            setCurrentPermission: mockStatusCacheSet
          },
          transaction: {
            getCurrentPermission: mockTransactionPageGet,
            setCurrentPermission: mockTransactionPageSet
          }
        }
      })
    }

    it('should set the licence fulfilment page to false on the status', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({ payload: { 'licence-length': '12M' } }))
      mockTransactionPageGet.mockImplementationOnce(() => ({ licenceLength: '' }))
      await updateTransaction(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith({ [LICENCE_FULFILMENT.page]: false })
    })
  })
})
