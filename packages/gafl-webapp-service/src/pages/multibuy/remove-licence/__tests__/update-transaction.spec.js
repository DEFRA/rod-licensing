import { ADD_LICENCE, REMOVE_LICENCE } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const createCache = (cache = {}) => ({
  helpers: {
    status: {
      setCurrentPermission: cache.statusSetCurrentPermission || (() => {}),
      get: () => cache.status || { permissions: [getStatusPermission(), getStatusPermission(), getStatusPermission()] },
      set: cache.statusSet || (() => {})
    },
    transaction: {
      getCurrentPermission: () => cache.transaction?.permissions[0] || {},
      get: () =>
        cache.transaction || {
          permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()]
        },
      set: () => cache.transaction || (() => {})
    },
    page: {
      get: () => cache.page || { permissions: [getPagePermission(), getPagePermission(), getPagePermission()] },
      set: () => cache.page || (() => {})
    },
    addressLookup: {
      getCurrentPermission: () => cache.addressLookup?.permissions[0] || {},
      get: () => cache.addressLookup || { permissions: [{}, {}, {}] },
      set: () => cache.addressLookup || (() => {})
    }
  }
})

const createMockRequest = (opts = {}) => ({
  cache: () => createCache(opts.cache)
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
    const mockRequest = createMockRequest({ cache: { transaction } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.transaction.set()).toEqual(expect.objectContaining(transaction))
  })

  it('page cache is updated after permission is deleted', async () => {
    const page = { permissions: [getPagePermission({ [REMOVE_LICENCE.page]: true }), getPagePermission(), getPagePermission()] }
    const mockRequest = createMockRequest({ cache: { page } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.page.set()).toEqual(expect.objectContaining(page))
  })

  it('status cache is updated after permission is deleted', async () => {
    const statusSet = jest.fn()
    const status = { permissions: [getStatusPermission({ [REMOVE_LICENCE.page]: true }), getStatusPermission(), getStatusPermission()] }
    const mockRequest = createMockRequest({ cache: { status, statusSet } })
    await updateTransaction(mockRequest)
    expect(statusSet).toHaveBeenCalledWith(status)
  })

  it('addressLookup cache is updated after permission is deleted', async () => {
    const addressLookup = { permissions: [{}, {}, {}] }
    const mockRequest = createMockRequest({ cache: { addressLookup } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.addressLookup.set()).toEqual(expect.objectContaining(addressLookup))
  })

  describe('after remove licence', () => {
    it('transaction cache has a permission removed', async () => {
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const mockRequest = createMockRequest({ cache: { transaction } })
      await updateTransaction(mockRequest)
      expect(transaction.permissions.every(p => p.licenceType === 'trout-and-coarse')).toBeTruthy()
    })

    it('page cache has a permission removed', async () => {
      const removePage = { [REMOVE_LICENCE.page]: true }
      const page = { permissions: [getPagePermission(removePage), getPagePermission(), getPagePermission()] }
      const mockRequest = createMockRequest({ cache: { page } })
      await updateTransaction(mockRequest)
      expect(page.permissions.filter(item => Object.keys(item).includes(removePage)).length).toEqual(0)
    })

    it('status cache has a permission removed', async () => {
      const removeStatus = { [REMOVE_LICENCE.page]: true }
      const status = { permissions: [getStatusPermission({ [REMOVE_LICENCE.page]: true }), getStatusPermission(), getStatusPermission()] }
      const mockRequest = createMockRequest({ cache: { status } })
      await updateTransaction(mockRequest)
      expect(status.permissions.filter(item => Object.keys(item).includes(removeStatus)).length).toEqual(0)
    })

    it('addressLookup cache has a permission removed', async () => {
      const removeAddress = { example: true }
      const addressLookup = { permissions: [{ removeAddress }, {}, {}] }
      const mockRequest = createMockRequest({ cache: { addressLookup } })
      await updateTransaction(mockRequest)
      expect(addressLookup.permissions.filter(item => Object.keys(item).includes(removeAddress)).length).toEqual(0)
    })

    it('update the status cache to the number of transactions left (currentPermissionIdx)', async () => {
      const statusSet = jest.fn()
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const status = { permissions: [getStatusPermission({ [REMOVE_LICENCE.page]: true }), getStatusPermission(), getStatusPermission()] }
      const mockRequest = createMockRequest({ cache: { status, transaction, statusSet } })
      await updateTransaction(mockRequest)
      expect(statusSet).toHaveBeenCalledWith({ currentPermissionIdx: 1 })
    })

    it('all transactions are deleted so status is only set once and not with currentPermissionIdx', async () => {
      const statusSet = jest.fn()
      const transaction = { permissions: [getTransactionPermissionOne()] }
      const status = { permissions: [getStatusPermission({ [REMOVE_LICENCE.page]: true }), getStatusPermission(), getStatusPermission()] }
      const mockRequest = createMockRequest({ cache: { status, transaction, statusSet } })
      await updateTransaction(mockRequest)
      expect(statusSet).toBeCalledTimes(1)
    })

    it('update the status to have a new current permission as latest one deleted', async () => {
      const setPermission = getStatusPermission()
      const statusSetCurrentPermission = jest.fn()
      const status = { permissions: [getStatusPermission(), setPermission, getStatusPermission({ [REMOVE_LICENCE.page]: true })] }
      const mockRequest = createMockRequest({ cache: { status, statusSetCurrentPermission } })
      await updateTransaction(mockRequest)
      expect(statusSetCurrentPermission).toHaveBeenCalledWith(setPermission)
    })

    it('all transactions are deleted so setCurrentPermission is not called', async () => {
      const statusSetCurrentPermission = jest.fn()
      const transaction = { permissions: [getTransactionPermissionOne()] }
      const mockRequest = createMockRequest({ cache: { transaction, statusSetCurrentPermission } })
      await updateTransaction(mockRequest)
      expect(statusSetCurrentPermission).toBeCalledTimes(0)
    })
  })
})
