import updateTransaction from '../update-transaction'

describe('licence-confirmation-method > update-transaction', () => {
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

  it('should set email in cache, when licence confirmation method is email', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-confirmation-method': 'email',
        email: 'example@example.com'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(
      expect.objectContaining({ licensee: { email: 'example@example.com', preferredMethodOfConfirmation: 'Email' } })
    )
  })

  it('should set mobilePhone in cache, when licence confirmation method is text', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-confirmation-method': 'text',
        text: '07700900088'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(
      expect.objectContaining({ licensee: { mobilePhone: '07700900088', preferredMethodOfConfirmation: 'Text' } })
    )
  })
})
