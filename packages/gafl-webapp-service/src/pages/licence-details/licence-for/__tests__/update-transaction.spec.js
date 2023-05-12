import updateTransaction from '../update-transaction'

describe('licence-for > update-transaction', () => {
  beforeEach(jest.clearAllMocks)

  const mockPageCacheGet = jest.fn()
  const mockTransactionCacheSet = jest.fn()
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: mockPageCacheGet
        },
        transaction: {
          setCurrentPermission: mockTransactionCacheSet,
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    })
  }

  describe('default', () => {
    it.skip('should set isLicenceForYou to true on the transaction cache, if user has selected you', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({ payload: { 'licence-for': 'you' } }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))

      await updateTransaction(mockRequest)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith({ isLicenceForYou: true })
    })

    it.skip('should set isLicenceForYou to false on the transaction cache, if user has selected someone-else', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({ payload: { 'licence-for': 'someone-else' } }))
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))

      await updateTransaction(mockRequest)
      expect(mockTransactionCacheSet).toHaveBeenCalledWith({ isLicenceForYou: false })
    })
  })
})
