import updateTransaction from '../update-transaction'

describe('licence-fulfilment > update-transaction', () => {
  const mockTransactionCacheSet = jest.fn()
  const mockPageCacheGet = jest.fn()
  const mockRequest = {
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: mockPageCacheGet
        },
        transaction: {
          getCurrentPermission: () => ({
            licensee: {}
          }),
          setCurrentPermission: mockTransactionCacheSet
        }
      }
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set postalFulfilment to no in cache, when licence-option is digital', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-option': 'digital'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(expect.objectContaining({ licensee: { postalFulfilment: 'No' } }))
  })

  it('should set postalFulfilment to yes in cache, when licence-option is paper-licence', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-option': 'paper-licence'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(expect.objectContaining({ licensee: { postalFulfilment: 'Yes' } }))
  })
})
