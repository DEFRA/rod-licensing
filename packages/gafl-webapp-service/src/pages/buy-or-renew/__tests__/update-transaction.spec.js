import updateTransaction from '../update-transaction.js'

describe('buy-or-renew > update-transaction', () => {
  beforeEach(jest.clearAllMocks)

  const mockPageCacheGet = jest.fn()
  const mockTransactionCacheSet = jest.fn()
  const mockTransactionCacheGet = jest.fn()
  const mockStatusCacheSet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: mockPageCacheGet
        },
        transaction: {
          setCurrentPermission: mockTransactionCacheSet,
          getCurrentPermission: mockTransactionCacheGet
        },
        status: {
          setCurrentPermission: mockStatusCacheSet
        }
      }
    })
  }

  describe('default', () => {
    it('should set buyNewLicence to true on the transaction cache, if user has selected buy-licence', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({ payload: { 'buy-or-renew': 'buy-licence' } }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))

      await updateTransaction(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith({ buyNewLicence: true })
    })

    it('should set buyNewLicence to false on the transaction cache, if user has selected renew-licence', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({ payload: { 'buy-or-renew': 'renew-licence' } }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))

      await updateTransaction(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith({ buyNewLicence: false })
    })
  })
})
