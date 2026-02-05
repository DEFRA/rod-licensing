jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    cancelRecurringPayment: jest.fn()
  }
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))

const getMockRequest = ({ id } = {}) => {
  const getCurrentPermission = jest.fn().mockResolvedValue({ recurringPayment: id ? { id } : {} })
  return {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission
        }
      }
    })
  }
}

describe('confirm update-transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('calls connector with id and reason', async () => {
    const { salesApi } = require('@defra-fish/connectors-lib')
    salesApi.cancelRecurringPayment.mockResolvedValueOnce()

    const updateTransaction = require('../update-transaction.js').default
    const request = getMockRequest({ id: 'rp-123' })

    await updateTransaction(request)

    expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith('rp-123', 'User Cancelled')
  })

  it('reads cache once', async () => {
    const updateTransaction = require('../update-transaction.js').default
    const request = getMockRequest({ id: 'rp-456' })

    await updateTransaction(request)

    const getCurrentPermission = request.cache().helpers.transaction.getCurrentPermission
    expect(getCurrentPermission).toHaveBeenCalledTimes(1)
  })

  it('calls connector once when connector rejects', async () => {
    const { salesApi } = require('@defra-fish/connectors-lib')
    const err = new Error('boom')
    salesApi.cancelRecurringPayment.mockRejectedValueOnce(err)

    const updateTransaction = require('../update-transaction.js').default
    const request = getMockRequest({ id: 'rp-789' })

    try {
      await updateTransaction(request)
    } catch (e) {}

    expect(salesApi.cancelRecurringPayment).toHaveBeenCalledTimes(1)
  })

  it('throws when connector rejects', async () => {
    const { salesApi } = require('@defra-fish/connectors-lib')
    const err = new Error('kaboom')
    salesApi.cancelRecurringPayment.mockRejectedValueOnce(err)

    const updateTransaction = require('../update-transaction.js').default
    const request = getMockRequest({ id: 'rp-000' })

    await expect(updateTransaction(request)).rejects.toBe(err)
  })

  it('does not call connector when id absent', async () => {
    const { salesApi } = require('@defra-fish/connectors-lib')
    const updateTransaction = require('../update-transaction.js').default
    const request = getMockRequest()

    try {
      await updateTransaction(request)
    } catch (e) {}

    expect(salesApi.cancelRecurringPayment).toHaveBeenCalledTimes(0)
  })
})
