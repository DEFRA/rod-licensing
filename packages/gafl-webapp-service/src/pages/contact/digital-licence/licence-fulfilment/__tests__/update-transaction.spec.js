import updateTransaction from '../update-transaction'
import { LICENCE_CONFIRMATION_METHOD } from '../../../../../uri.js'

describe('licence-fulfilment > update-transaction', () => {
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

  it('should set postalFulfilment to false in cache, when licence-option is digital', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-option': 'digital'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(expect.objectContaining({ licensee: { postalFulfilment: false } }))
  })

  it('should set postalFulfilment to true in cache, when licence-option is paper-licence', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-option': 'paper-licence'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockTransactionCacheSet).toHaveBeenCalledWith(expect.objectContaining({ licensee: { postalFulfilment: true } }))
  })

  it('should set the licence-confirmation-method page to false on the status cache', async () => {
    mockPageCacheGet.mockImplementationOnce(() => ({
      payload: {
        'licence-option': 'digital'
      }
    }))

    await updateTransaction(mockRequest)

    expect(mockStatusCacheSet).toHaveBeenCalledWith({ [LICENCE_CONFIRMATION_METHOD.page]: false })
  })
})
