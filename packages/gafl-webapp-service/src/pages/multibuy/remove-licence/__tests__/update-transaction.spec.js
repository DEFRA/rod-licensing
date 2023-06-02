import { ADD_LICENCE, REMOVE_LICENCE } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const getMockRequest = (opts = {}, statusSet = () => {}, statusSetCurrentPermission = () => {}) => ({
  cache: () => ({
    helpers: {
      status: {
        setCurrentPermission: statusSetCurrentPermission,
        get: () => opts.cache.status || { permissions: [getStatusPermission(), getStatusPermission(), getStatusPermission()] },
        set: statusSet
      },
      transaction: {
        getCurrentPermission: () => opts.cache.transaction?.permissions[0] || getTransactionPermissionThree(),
        get: () =>
          opts.cache.transaction || {
            permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()]
          },
        set: () => opts.cache.transaction || (() => {})
      },
      page: {
        get: () => opts.cache.page || { permissions: [getPagePermission(), getPagePermission(), getPagePermission()] },
        set: () => opts.cache.page || (() => {})
      },
      addressLookup: {
        getCurrentPermission: () => opts.cache.addressLookup?.permissions[0] || {},
        get: () => opts.cache.addressLookup || { permissions: [{}, {}, {}] },
        set: () => opts.cache.addressLookup || (() => {})
      }
    }
  })
})

const getTransactionPermissionOne = () => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: 'salmon-and-sea',
  numberOfRods: '1',
  licenceToStart: 'after-payment',
  licenceLength: '8D',
  permit: { cost: 12 },
  hash: 'abc-123'
})

const getTransactionPermissionTwo = () => ({
  ...getTransactionPermissionOne,
  licenceType: 'trout-and-coarse',
  numberOfRods: '2',
  licenceLength: '12M',
  hash: 'abc-456'
})

const getTransactionPermissionThree = () => ({
  ...getTransactionPermissionOne,
  licenceType: 'trout-and-coarse',
  numberOfRods: '3',
  licenceLength: '12M',
  hash: 'abc-789'
})

const getPagePermission = overrides => ({
  [ADD_LICENCE.page]: true,
  ...overrides
})

const getStatusPermission = overrides => ({
  [ADD_LICENCE.page]: true,
  ...overrides
})

describe('remove-licence > update transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('transaction cache is updated after permission is deleted', async () => {
    const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
    const mockRequest = getMockRequest({ cache: { transaction: transaction } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.transaction.set()).toEqual(expect.objectContaining(transaction))
  })

  it('page cache is updated after permission is deleted', async () => {
    const page = { permissions: [getPagePermission({ [REMOVE_LICENCE.page]: true }), getPagePermission(), getPagePermission()] }
    const mockRequest = getMockRequest({ cache: { page: page } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.page.set()).toEqual(expect.objectContaining(page))
  })

  it('status cache is updated after permission is deleted', async () => {
    const statusSet = jest.fn()
    const status = { permissions: [getStatusPermission({ [REMOVE_LICENCE.page]: true }), getStatusPermission(), getStatusPermission()] }
    const mockRequest = getMockRequest({ cache: { status } }, statusSet)
    await updateTransaction(mockRequest)
    expect(statusSet).toHaveBeenCalledWith(status)
  })

  it('addressLookup cache is updated after permission is deleted', async () => {
    const addressLookup = { permissions: [{}, {}, {}] }
    const mockRequest = getMockRequest({ cache: { addressLookup: addressLookup } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.addressLookup.set()).toEqual(expect.objectContaining(addressLookup))
  })

  describe('after remove licence', () => {
    it('transaction cache has a permission removed', async () => {
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const mockRequest = getMockRequest({ cache: { transaction: transaction } })
      await updateTransaction(mockRequest)
      expect(transaction.permissions.every(p => p.licenceType === 'trout-and-coarse')).toBeTruthy()
    })

    it('page cache has a permission removed', async () => {
      const page = { permissions: [getPagePermission({ [REMOVE_LICENCE.page]: true }), getPagePermission(), getPagePermission()] }
      const mockRequest = getMockRequest({ cache: { page: page } })
      await updateTransaction(mockRequest)
      expect(page.permissions.length).toEqual(2)
    })

    it('status cache has a permission removed', async () => {
      const status = { permissions: [getStatusPermission({ [REMOVE_LICENCE.page]: true }), getStatusPermission(), getStatusPermission()] }
      const mockRequest = getMockRequest({ cache: { status: status } })
      await updateTransaction(mockRequest)
      expect(status.permissions.length).toEqual(2)
    })

    it('addressLookup cache has a permission removed', async () => {
      const addressLookup = { permissions: [{}, {}, {}] }
      const mockRequest = getMockRequest({ cache: { addressLookup: addressLookup } })
      await updateTransaction(mockRequest)
      expect(addressLookup.permissions.length).toEqual(2)
    })

    it('update the status cache to the number of transactions left (currentPermissionIdx)', async () => {
      const statusSet = jest.fn()
      const status = { permissions: [getStatusPermission({ [REMOVE_LICENCE.page]: true }), getStatusPermission(), getStatusPermission()] }
      const mockRequest = getMockRequest({ cache: { status } }, statusSet)
      await updateTransaction(mockRequest)
      expect(statusSet).toHaveBeenCalledWith({ currentPermissionIdx: 1 })
    })

    it('all transactions are deleted so status is onyl set once and not with currentPermissionIdx', async () => {
      const statusSet = jest.fn()
      const transaction = { permissions: [getTransactionPermissionOne()] }
      const status = { permissions: [getStatusPermission({ [REMOVE_LICENCE.page]: true }), getStatusPermission(), getStatusPermission()] }
      const mockRequest = getMockRequest({ cache: { status, transaction } }, statusSet)
      await updateTransaction(mockRequest)
      expect(statusSet).toBeCalledTimes(1)
    })

    it('update the status to have a new current permission as latest one deleted', async () => {
      const setPermission = getStatusPermission()
      const statusSetCurrentPermission = jest.fn()
      const status = { permissions: [getStatusPermission(), setPermission, getStatusPermission({ [REMOVE_LICENCE.page]: true })] }
      const mockRequest = getMockRequest({ cache: { status } }, jest.fn(), statusSetCurrentPermission)
      await updateTransaction(mockRequest)
      expect(statusSetCurrentPermission).toHaveBeenCalledWith(setPermission)
    })

    it('all transactions are deleted so setCurrentPermission is not called', async () => {
      const statusSetCurrentPermission = jest.fn()
      const transaction = { permissions: [getTransactionPermissionOne()] }
      const mockRequest = getMockRequest({ cache: { transaction } }, jest.fn(), statusSetCurrentPermission)
      await updateTransaction(mockRequest)
      expect(statusSetCurrentPermission).toBeCalledTimes(0)
    })
  })
})
