import updateTransaction from '../update-transaction'

describe('newsletter > update-transaction', () => {
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

  it('should set email and preferredMethodOfNewsletter in cache, when newsletter is yes and email is present', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        newsletter: 'yes',
        email: 'example@example.com'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(
      expect.objectContaining({ licensee: { email: 'example@example.com', preferredMethodOfNewsletter: 'Email' } })
    )
  })

  it('should set preferredMethodOfNewsletter in cache, when newsletter is yes and email is not present', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        newsletter: 'yes'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(expect.objectContaining({ licensee: { preferredMethodOfNewsletter: 'Email' } }))

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(expect.not.objectContaining({ licensee: { email: 'example@example.com' } }))
  })

  it('should set preferredMethodOfNewsletter in cache, when newsletter is no', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        newsletter: 'no'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(
      expect.objectContaining({ licensee: { preferredMethodOfNewsletter: 'Prefer not to be contacted' } })
    )
  })
})
