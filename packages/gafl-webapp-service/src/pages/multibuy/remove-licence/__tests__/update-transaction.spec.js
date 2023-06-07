import { ADD_LICENCE, REMOVE_LICENCE } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const createMockRequest = ({
  addressLookupPermissions = [],
  setAddressLookup = () => {},
  currentAddressLookupPermission = {},

  transactionPermissions = [],
  setTransaction = () => {},
  currentTransactionPermission = {},

  pagePermissions = [{ [ADD_LICENCE.page]: true }],
  setPage = () => {},

  statusPermissions = [{ [ADD_LICENCE.page]: true }],
  setStatus = () => {},
  setCurrentStatus = () => {}
} = {}) => ({
  cache: () => ({
    helpers: {
      transaction: {
        get: () => ({ permissions: transactionPermissions }),
        getCurrentPermission: () => currentTransactionPermission,
        set: setTransaction
      },
      page: {
        get: () => ({ permissions: pagePermissions }),
        set: setPage
      },
      status: {
        get: () => ({ permissions: statusPermissions }),
        set: setStatus,
        setCurrentPermission: setCurrentStatus
      },
      addressLookup: {
        get: () => ({ permissions: addressLookupPermissions }),
        getCurrentPermission: () => currentAddressLookupPermission,
        set: setAddressLookup
      }
    }
  })
})

describe('update transaction', () => {
  it('address lookup is removed', async () => {
    const addressLookupPermissions = [{}, {}, {}]
    const [addressLookup1, addressLookup2, addressLookup3] = addressLookupPermissions
    const setAddressLookup = jest.fn()
    const mockRequest = createMockRequest({
      addressLookupPermissions,
      setAddressLookup,
      currentAddressLookupPermission: addressLookup2
    })

    await updateTransaction(mockRequest)

    const newAddressLookupItems = setAddressLookup.mock.calls[0][0]
    expect(newAddressLookupItems.permissions.length).toBe(2)
    expect(newAddressLookupItems.permissions[0]).toStrictEqual(addressLookup1)
    expect(newAddressLookupItems.permissions[1]).toStrictEqual(addressLookup3)
  })

  it('transaction is removed', async () => {
    const transactionPermissions = [{ hash: 'abc-999' }, { hash: 'aaa-111' }, { hash: 'zzz-010' }]
    const [permission1, permission2, permission3] = transactionPermissions
    const setTransaction = jest.fn()
    const mockRequest = createMockRequest({
      transactionPermissions,
      setTransaction,
      currentTransactionPermission: permission2
    })

    await updateTransaction(mockRequest)

    const newTransactionPermissions = setTransaction.mock.calls[0][0]
    expect(newTransactionPermissions.permissions.length).toBe(2)
    expect(newTransactionPermissions.permissions[0]).toStrictEqual(permission1)
    expect(newTransactionPermissions.permissions[1]).toStrictEqual(permission3)
  })

  it('page is removed', async () => {
    const pagePermissions = [
      { [ADD_LICENCE.page]: true },
      { [REMOVE_LICENCE.page]: true, [ADD_LICENCE.page]: true },
      { [ADD_LICENCE.page]: true }
    ]
    const [permission1, , permission3] = pagePermissions
    const setPage = jest.fn()
    const mockRequest = createMockRequest({
      pagePermissions,
      setPage
    })

    await updateTransaction(mockRequest)

    const newPagePermissions = setPage.mock.calls[0][0]
    expect(newPagePermissions.permissions.length).toBe(2)
    expect(newPagePermissions.permissions[0]).toStrictEqual(permission1)
    expect(newPagePermissions.permissions[1]).toStrictEqual(permission3)
  })

  it('status is removed', async () => {
    const statusPermissions = [
      { [ADD_LICENCE.page]: true },
      { [REMOVE_LICENCE.page]: true, [ADD_LICENCE.page]: true },
      { [ADD_LICENCE.page]: true }
    ]
    const [permission1, , permission3] = statusPermissions
    const setStatus = jest.fn()
    const mockRequest = createMockRequest({
      statusPermissions,
      setStatus
    })

    await updateTransaction(mockRequest)

    const newStatusPermissions = setStatus.mock.calls[0][0]
    expect(newStatusPermissions.permissions.length).toBe(2)
    expect(newStatusPermissions.permissions[0]).toStrictEqual(permission1)
    expect(newStatusPermissions.permissions[1]).toStrictEqual(permission3)
  })

  it('status current permission is set to the latest permission', async () => {
    const transactionPermissions = [{ hash: 'abc-999' }, { hash: 'aaa-111' }, { hash: 'zzz-010' }]
    const statusPermissions = [
      { [ADD_LICENCE.page]: true },
      { [REMOVE_LICENCE.page]: true, [ADD_LICENCE.page]: true },
      { [ADD_LICENCE.page]: true }
    ]
    const [, , permission3] = statusPermissions
    const setCurrentStatus = jest.fn()
    const mockRequest = createMockRequest({
      transactionPermissions,
      statusPermissions,
      setCurrentStatus
    })

    await updateTransaction(mockRequest)

    const newStatusPermission = setCurrentStatus.mock.calls[0][0]
    expect(newStatusPermission).toStrictEqual(permission3)
  })

  it('status sets current permission Idx to the length of permissions in status', async () => {
    const transactionPermissions = [{ hash: 'abc-999' }, { hash: 'aaa-111' }, { hash: 'zzz-010' }]
    const statusPermissions = [
      { [ADD_LICENCE.page]: true },
      { [REMOVE_LICENCE.page]: true, [ADD_LICENCE.page]: true },
      { [ADD_LICENCE.page]: true }
    ]
    const setStatus = jest.fn()
    const mockRequest = createMockRequest({
      transactionPermissions,
      statusPermissions,
      setStatus
    })

    await updateTransaction(mockRequest)

    const { currentPermissionIdx } = setStatus.mock.calls[1][0]
    expect(currentPermissionIdx).toBe(statusPermissions.length - 1)
  })

  describe('all licences removed', () => {
    it('current permission of the status is not updated to the latest current permission', async () => {
      const currentTransactionPermission = { hash: 'abc-123' }
      const transactionPermissions = [currentTransactionPermission]
      const setCurrentStatus = jest.fn()
      const mockRequest = createMockRequest({
        currentTransactionPermission,
        transactionPermissions,
        setCurrentStatus
      })

      await updateTransaction(mockRequest)

      expect(setCurrentStatus).toBeCalledTimes(0)
    })

    it('current permission of the status is not updated with updated currentPermissionIdx', async () => {
      const currentTransactionPermission = { hash: 'abc-123' }
      const transactionPermissions = [currentTransactionPermission]
      const statusPermissions = [{ [REMOVE_LICENCE.page]: true, [ADD_LICENCE.page]: true }]
      const setStatus = jest.fn()

      const mockRequest = createMockRequest({
        currentTransactionPermission,
        transactionPermissions,
        statusPermissions,
        setStatus
      })

      await updateTransaction(mockRequest)

      expect(setStatus).toHaveBeenCalledWith(expect.objectContaining({ permissions: [] }))
      expect(setStatus).toBeCalledTimes(1)
    })
  })
})
