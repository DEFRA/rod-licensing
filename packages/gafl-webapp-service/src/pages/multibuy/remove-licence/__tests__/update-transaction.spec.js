import { ADD_LICENCE, REMOVE_LICENCE } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const createCache = (cache = {}) => ({
  helpers: {
    status: {
      setCurrentPermission: () => cache.status?.permissions[0] || {},
      get: () => cache.status || { permissions: [getStatusPermission(), getStatusPermission(), getStatusPermission()] },
      set: () => cache.status || (() => {})
    },
    transaction: {
      getCurrentPermission: () => cache.transaction?.permissions[0] || {},
      get: () => cache.transaction || { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
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

export const createMockRequest = (opts = {}) => ({
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

const getPagePermission = (remove = false) => ({
  [ADD_LICENCE.page]: true,
  [REMOVE_LICENCE.page]: remove
})

const getStatusPermission = (remove = false) => ({
  [ADD_LICENCE.page]: true,
  [REMOVE_LICENCE.page]: remove
})

describe('remove-licence > update transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('status.setCurrentPermission is being called with different permission', async () => {
    const setPermission = getStatusPermission(true)
    const mockRequest = createMockRequest({ cache: { status: { permissions: [getStatusPermission(), getStatusPermission(), setPermission] } } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.status.setCurrentPermission()).toEqual(expect.objectContaining(setPermission))
  })

  it('transaction.set is being called with a permission removed', async () => {
    const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
    const mockRequest = createMockRequest({ cache: { transaction: transaction } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.transaction.set()).toEqual(expect.objectContaining(transaction))
  })

  it('page.set is being called with a permission removed', async () => {
    const page = { permissions: [getPagePermission(true), getPagePermission(), getPagePermission()] }
    const mockRequest = createMockRequest({ cache: { page: page } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.page.set()).toEqual(expect.objectContaining(page))
  })

  it('status.set is being called with a permission removed', async () => {
    const status = { permissions: [getStatusPermission(true), getStatusPermission(), getStatusPermission()] }
    const mockRequest = createMockRequest({ cache: { status: status } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.status.set()).toEqual(expect.objectContaining(status))
  })

  it('addressLookup.set is being called with a permission removed', async () => {
    const addressLookup = { permissions: [{}, {}, {}] }
    const mockRequest = createMockRequest({ cache: { addressLookup: addressLookup } })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.addressLookup.set()).toEqual(expect.objectContaining(addressLookup))
  })

  describe('after remove licence', () => {
    it('transaction does not contain the transaction currentPermission', async () => {
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const mockRequest = createMockRequest({ cache: { transaction: transaction } })
      await updateTransaction(mockRequest)
      const permissions = transaction.permissions
      expect(permissions.filter(p => p).length).toEqual(2)
    })

    it('page does not contain the page currentPermission', async () => {
      const page = { permissions: [getPagePermission(true), getPagePermission(), getPagePermission()] }
      const mockRequest = createMockRequest({ cache: { page: page } })
      await updateTransaction(mockRequest)
      const permissions = page.permissions
      expect(permissions.filter(p => p).length).toEqual(2)
    })

    it('status does not contain the status currentPermission', async () => {
      const status = { permissions: [getStatusPermission(true), getStatusPermission(), getStatusPermission()] }
      const mockRequest = createMockRequest({ cache: { status: status } })
      await updateTransaction(mockRequest)
      const permissions = status.permissions
      expect(permissions.filter(p => p).length).toEqual(2)
    })

    it('addressLookup does not contain the addressLookup currentPermission', async () => {
      const addressLookup = { permissions: [{}, {}, {}] }
      const mockRequest = createMockRequest({ cache: { addressLookup: addressLookup } })
      await updateTransaction(mockRequest)
      const permissions = addressLookup.permissions
      expect(permissions.filter(p => p).length).toEqual(2)
    })

    it('setCurrentPermission is called with latest permission for status', async () => {
      const setPermission = getStatusPermission(true)
      const mockRequest = createMockRequest({ cache: { status: { permissions: [getStatusPermission(), getStatusPermission(), setPermission] } } })
      await updateTransaction(mockRequest)
      expect(mockRequest.cache().helpers.status.setCurrentPermission()).toEqual(setPermission)
    })
  })
})