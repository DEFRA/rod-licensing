import updateTransaction from '../update-transaction'
import { CONTACT } from '../../../../../uri.js'

describe('licence-confirmation-method > update-transaction', () => {
  const mockTransactionCacheSet = jest.fn()
  const mockPageCacheGet = jest.fn()
  const mockStatusCacheSet = jest.fn()

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
        },
        status: {
          setCurrentPermission: mockStatusCacheSet
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

  it('should set none in cache, when licence confirmation method is none', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-confirmation-method': 'none'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(
      expect.objectContaining({ licensee: { preferredMethodOfConfirmation: 'Prefer not to be contacted' } })
    )
  })

  it('should set the contact page to false on the status cache', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-confirmation-method': 'none'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockStatusCacheSet).toHaveBeenCalledWith({ [CONTACT.page]: false })
  })
})
