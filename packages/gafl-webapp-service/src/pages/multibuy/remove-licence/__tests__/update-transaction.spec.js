import { ADD_LICENCE, REMOVE_LICENCE } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'
import { createMockRequest } from '../../../../__mocks__/request.js'

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
  hash: '81427565a0b8c98de3c5ffff9bf8f13a4fb38f85860abdc84d1585f7ef4ea2f8'
})

const getTransactionPermissionTwo = () => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: 'trout-and-coarse',
  numberOfRods: '2',
  licenceToStart: 'after-payment',
  licenceLength: '12M',
  permit: { cost: 12 },
  hash: '81427565a0b8c98de3c5ffff9bf8f13a4fb38f85860abdc84d1585f7ef4ea2f7'
})

const getTransactionPermissionThree = () => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: 'trout-and-coarse',
  numberOfRods: '3',
  licenceToStart: 'after-payment',
  licenceLength: '12M',
  permit: { cost: 12 },
  hash: '81427565a0b8c98de3c5ffff9bf8f13a4fb38f85860abdc84d1585f7ef4ea2f9'
})

const getPagePermissionOne = () => ({
  [ADD_LICENCE.page]: true
})

const getPagePermissionTwo = () => ({
  [ADD_LICENCE.page]: true,
  [REMOVE_LICENCE.page]: true
})

const getPagePermissionThree = () => ({
  [ADD_LICENCE.page]: true
})

const getStatusPermissionOne = () => ({
  [ADD_LICENCE.page]: false,
  [REMOVE_LICENCE.page]: true
})

const getStatusPermissionTwo = () => ({
  [ADD_LICENCE.page]: true
})

const getStatusPermissionThree = () => ({
  [ADD_LICENCE.page]: true
})

const getAddressLookupPermissionOne = () => ({})

const getAddressLookupPermissionTwo = () => ({})

const getAddressLookupPermissionThree = () => ({})

describe('remove-licence > update transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('status.setCurrentPermission is being called with different permission', async () => {
    const setPermission = getStatusPermissionThree()
    const mockRequest = createMockRequest({
      cache: {
        transaction: { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
        page: { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] },
        status: { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), setPermission] },
        addressLookup: {
          permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
        }
      }
    })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.status.setCurrentPermission()).toEqual(expect.objectContaining(setPermission))
  })

  it('transaction.set is being called with a permission removed', async () => {
    const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
    const mockRequest = createMockRequest({
      cache: {
        transaction: transaction,
        page: { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] },
        status: { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] },
        addressLookup: {
          permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
        }
      }
    })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.transaction.set()).toEqual(expect.objectContaining(transaction))
  })

  it('page.set is being called with a permission removed', async () => {
    const page = { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] }
    const mockRequest = createMockRequest({
      cache: {
        transaction: { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
        page: page,
        status: { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] },
        addressLookup: {
          permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
        }
      }
    })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.page.set()).toEqual(expect.objectContaining(page))
  })

  it('status.set is being called with a permission removed', async () => {
    const status = { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] }
    const mockRequest = createMockRequest({
      cache: {
        transaction: { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
        page: { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] },
        status: status,
        addressLookup: {
          permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
        }
      }
    })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.status.set()).toEqual(expect.objectContaining(status))
  })

  it('addressLookup.set is being called with a permission removed', async () => {
    const addressLookup = {
      permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
    }
    const mockRequest = createMockRequest({
      cache: {
        transaction: { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
        page: { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] },
        status: { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] },
        addressLookup: addressLookup
      }
    })
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.addressLookup.set()).toEqual(expect.objectContaining(addressLookup))
  })

  describe('after remove licence', () => {
    it('transaction does not contain the transaction currentPermission', async () => {
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const mockRequest = createMockRequest({
        cache: {
          transaction: transaction,
          page: { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] },
          status: { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] },
          addressLookup: {
            permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
          }
        }
      })
      await updateTransaction(mockRequest)
      const permissions = transaction.permissions
      expect(permissions.filter(p => p.licenceType === 'salmon-and-sea').length).toEqual(0)
    })

    it('page does not contain the page currentPermission', async () => {
      const page = { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] }
      const mockRequest = createMockRequest({
        cache: {
          transaction: { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
          page: page,
          status: { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] },
          addressLookup: {
            permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
          }
        }
      })
      await updateTransaction(mockRequest)
      const permissions = page.permissions
      expect(permissions.filter(p => p['remove-licence'] === true).length).toEqual(0)
    })

    it('status does not contain the status currentPermission', async () => {
      const status = { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] }
      const mockRequest = createMockRequest({
        cache: {
          transaction: { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
          page: { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] },
          status: status,
          addressLookup: {
            permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
          }
        }
      })
      await updateTransaction(mockRequest)
      const permissions = status.permissions
      expect(permissions.filter(p => p['remove-licence'] === true).length).toEqual(0)
    })

    it('addressLookup does not contain the addressLookup currentPermission', async () => {
      const addressLookup = {
        permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
      }
      const mockRequest = createMockRequest({
        cache: {
          transaction: { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
          page: { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] },
          status: { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] },
          addressLookup: addressLookup
        }
      })
      await updateTransaction(mockRequest)
      const permissions = addressLookup.permissions
      expect(permissions.filter(p => p).length).toEqual(2)
    })

    it('setCurrentPermission is called with latest permission for status', async () => {
      const setPermission = getStatusPermissionThree()
      const mockRequest = createMockRequest({
        cache: {
          transaction: { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] },
          page: { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] },
          status: { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), setPermission] },
          addressLookup: {
            permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
          }
        }
      })
      await updateTransaction(mockRequest)
      expect(mockRequest.cache().helpers.status.setCurrentPermission()).toEqual(setPermission)
    })
  })
})
