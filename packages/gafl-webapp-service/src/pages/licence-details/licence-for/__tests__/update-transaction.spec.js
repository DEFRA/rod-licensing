import updateTransaction from '../update-transaction'

describe('licence-for > update-transaction', () => {
  beforeEach(jest.clearAllMocks)

  const mockPageCacheGet = jest.fn()
  const mockStatusCacheSet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: mockPageCacheGet
        },
        status: {
          setCurrentPermission: mockStatusCacheSet
        }
      }
    })
  }

  describe('default', () => {
    it('should set isLicenceForYou to true if user has selected you', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({payload:{'licence-for': 'you'}}))
      await updateTransaction(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith({ isLicenceForYou: true })
    })

    it('should set isLicenceForYou to false if user has selected someone-else', async () => {
      mockPageCacheGet.mockImplementationOnce(() => ({payload:{'licence-for': 'someone-else'}}))
      await updateTransaction(mockRequest)
      expect(mockStatusCacheSet).toHaveBeenCalledWith({ isLicenceForYou: false })
    })
  })
})
