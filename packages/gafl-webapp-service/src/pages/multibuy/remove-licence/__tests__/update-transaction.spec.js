import { ADD_LICENCE, REMOVE_LICENCE } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const getTransactionPermissionOne = () => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: 'trout-and-coarse',
  numberOfRods: '2',
  licenceToStart: 'after-payment',
  licenceLength: '12M',
  permit: { cost: 12 }
})

const getTransactionPermissionTwo = () => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: 'salmon-and-sea',
  numberOfRods: '1',
  licenceToStart: 'after-payment',
  licenceLength: '8D',
  permit: { cost: 12 }
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
  permit: { cost: 12 }
})

const getPagePermissionOne = () => ({
  [ADD_LICENCE.page]: [Object]
})

const getPagePermissionTwo = () => ({
  [ADD_LICENCE.page]: [Object],
  [REMOVE_LICENCE]: [Object]
})

const getPagePermissionThree = () => ({
  [ADD_LICENCE.page]: [Object]
})

const getStatusPermissionOne = () => ({
  [ADD_LICENCE.page]: true
})

const getStatusPermissionTwo = () => ({
  [ADD_LICENCE.page]: false,
  [REMOVE_LICENCE.page]: true
})

const getStatusPermissionThree = () => ({
  [ADD_LICENCE.page]: true
})

const getAddressLookupPermissionOne = () => ({})

const getAddressLookupPermissionTwo = () => ({})

const getAddressLookupPermissionThree = () => ({})

const createRequestMock = (
  transaction,
  transactionPermission,
  setTransaction = jest.fn(),
  page,
  setPage = jest.fn(),
  status,
  setStatus = jest.fn(),
  setCurrentStatusPermission = jest.fn(),
  addressLookup,
  addressLookupPermission,
  setAddressLookup = jest.fn()
) => ({
  cache: () => ({
    helpers: {
      transaction: {
        get: async () => transaction,
        getCurrentPermission: async () => transactionPermission,
        set: setTransaction
      },
      page: {
        get: async () => page,
        set: setPage
      },
      status: {
        get: async () => status,
        set: setStatus,
        setCurrentPermission: setCurrentStatusPermission
      },
      addressLookup: {
        get: async () => addressLookup,
        getCurrentPermission: async () => addressLookupPermission,
        set: setAddressLookup
      }
    }
  })
})

describe('remove-licence > update transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const transaction = {
    permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()]
  }

  const page = {
    permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()]
  }

  const status = {
    permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()]
  }

  const addressLookup = {
    permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
  }

  it('status.setCurrentPermission is being called with different permission', async () => {
    const setCurrentPermission = jest.fn()
    const permission = getStatusPermissionThree()
    const mockRequest = createRequestMock(
      transaction,
      getTransactionPermissionTwo(),
      jest.fn(),
      page,
      jest.fn(),
      status,
      jest.fn(),
      setCurrentPermission,
      addressLookup,
      getAddressLookupPermissionTwo(),
      jest.fn()
    )
    await updateTransaction(mockRequest)
    expect(setCurrentPermission).toHaveBeenCalledWith(expect.objectContaining(permission))
  })

  it('transaction.set is being called with a permission removed', async () => {
    const set = jest.fn()
    const mockRequest = createRequestMock(
      transaction,
      getTransactionPermissionTwo(),
      set,
      page,
      jest.fn(),
      status,
      jest.fn(),
      jest.fn(),
      addressLookup,
      getAddressLookupPermissionTwo(),
      jest.fn()
    )
    await updateTransaction(mockRequest)
    expect(set).toHaveBeenCalledWith(expect.objectContaining(transaction))
  })

  it('page.set is being called with a permission removed', async () => {
    const set = jest.fn()
    const mockRequest = createRequestMock(
      transaction,
      getTransactionPermissionTwo(),
      jest.fn(),
      page,
      set,
      status,
      jest.fn(),
      jest.fn(),
      addressLookup,
      getAddressLookupPermissionTwo(),
      jest.fn()
    )
    await updateTransaction(mockRequest)
    expect(set).toHaveBeenCalledWith(expect.objectContaining(page))
  })

  it('status.set is being called with a permission removed', async () => {
    const set = jest.fn()
    const mockRequest = createRequestMock(
      transaction,
      getTransactionPermissionTwo(),
      jest.fn(),
      page,
      jest.fn(),
      status,
      set,
      jest.fn(),
      addressLookup,
      getAddressLookupPermissionTwo(),
      jest.fn()
    )
    await updateTransaction(mockRequest)
    expect(set).toHaveBeenCalledWith(expect.objectContaining(status))
  })

  it('addressLookup.set is being called with a permission removed', async () => {
    const set = jest.fn()
    const mockRequest = createRequestMock(
      transaction,
      getTransactionPermissionTwo(),
      jest.fn(),
      page,
      jest.fn(),
      status,
      jest.fn(),
      jest.fn(),
      addressLookup,
      getAddressLookupPermissionTwo(),
      set
    )
    await updateTransaction(mockRequest)
    expect(set).toHaveBeenCalledWith(expect.objectContaining(addressLookup))
  })

  describe('after remove licence', () => {
    it('transaction does not contain the transaction currentPermission', async () => {
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const page = { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] }
      const status = { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] }
      const addressLookup = {
        permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
      }
      const mockRequest = createRequestMock(
        transaction,
        getTransactionPermissionTwo(),
        jest.fn(),
        page,
        jest.fn(),
        status,
        jest.fn(),
        jest.fn(),
        addressLookup,
        getAddressLookupPermissionTwo(),
        jest.fn()
      )
      await updateTransaction(mockRequest)
      const permissions = transaction.permissions
      expect(permissions.filter(p => p.licenceType === 'salmon-and-sea').length).toEqual(0)
    })

    it('page does not contain the page currentPermission', async () => {
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const page = { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] }
      const status = { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] }
      const addressLookup = {
        permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
      }
      const mockRequest = createRequestMock(
        transaction,
        getTransactionPermissionTwo(),
        jest.fn(),
        page,
        jest.fn(),
        status,
        jest.fn(),
        jest.fn(),
        addressLookup,
        getAddressLookupPermissionTwo(),
        jest.fn()
      )
      await updateTransaction(mockRequest)
      const permissions = page.permissions
      expect(permissions.filter(p => p['remove-licence'] === true).length).toEqual(0)
    })

    it('status does not contain the status currentPermission', async () => {
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const page = { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] }
      const status = { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] }
      const addressLookup = {
        permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
      }
      const mockRequest = createRequestMock(
        transaction,
        getTransactionPermissionTwo(),
        jest.fn(),
        page,
        jest.fn(),
        status,
        jest.fn(),
        jest.fn(),
        addressLookup,
        getAddressLookupPermissionTwo(),
        jest.fn()
      )
      await updateTransaction(mockRequest)
      const permissions = status.permissions
      expect(permissions.filter(p => p['remove-licence'] === true).length).toEqual(0)
    })

    it('addressLookup does not contain the addressLookup currentPermission', async () => {
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const page = { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] }
      const status = { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), getStatusPermissionThree()] }
      const addressLookup = {
        permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
      }
      const mockRequest = createRequestMock(
        transaction,
        getTransactionPermissionTwo(),
        jest.fn(),
        page,
        jest.fn(),
        status,
        jest.fn(),
        jest.fn(),
        addressLookup,
        getAddressLookupPermissionTwo(),
        jest.fn()
      )
      await updateTransaction(mockRequest)
      const permissions = addressLookup.permissions
      expect(permissions.filter(p => p).length).toEqual(2)
    })

    it('setCurrentPermission is called with latest permission for status', async () => {
      const setCurrentPermission = jest.fn()
      const setPermission = getStatusPermissionThree()
      const transaction = { permissions: [getTransactionPermissionOne(), getTransactionPermissionTwo(), getTransactionPermissionThree()] }
      const page = { permissions: [getPagePermissionOne(), getPagePermissionTwo(), getPagePermissionThree()] }
      const status = { permissions: [getStatusPermissionOne(), getStatusPermissionTwo(), setPermission] }
      const addressLookup = {
        permissions: [getAddressLookupPermissionOne(), getAddressLookupPermissionTwo(), getAddressLookupPermissionThree()]
      }
      const mockRequest = createRequestMock(
        transaction,
        getTransactionPermissionTwo(),
        jest.fn(),
        page,
        jest.fn(),
        status,
        jest.fn(),
        setCurrentPermission,
        addressLookup,
        getAddressLookupPermissionTwo(),
        jest.fn()
      )
      await updateTransaction(mockRequest)
      expect(setCurrentPermission).toBeCalledWith(setPermission)
    })
  })
})
