import { ADD_LICENCE, REMOVE_LICENCE } from '../../../../uri.js'
import { hasDuplicates } from '../../../../processors/multibuy-processor.js'
import updateTransaction from '../update-transaction.js'

jest.mock('../../../../processors/multibuy-processor.js', () => ({
  hasDuplicates: jest.fn(() => false)
}))

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

  it('transaction is removed - no duplicates', async () => {
    const transactionPermissions = [
      { hash: 'abc-999', length: '12M' },
      { hash: 'aaa-111', length: '1D' },
      { hash: 'zzz-010', length: '8D' }
    ]
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

  const getTransactionPermission = length => ({
    licenceHolder: 'Test Person',
    start: '2021-01-01',
    type: 'salmon-and-sea',
    length,
    hash: 'abc-999'
  })

  describe('duplicate licences', () => {
    it.each`
      desc                                                                                                           | transactionPermissions                                                                                                                                                 | result
      ${'two identical permissions'}                                                                                 | ${[getTransactionPermission('12M'), getTransactionPermission('12M')]}                                                                                                  | ${[getTransactionPermission('12M')]}
      ${'several permissions, all different apart from two identical permissions that arent consecutively placed'}   | ${[getTransactionPermission('12M'), getTransactionPermission('1D'), getTransactionPermission('12M')]}                                                                  | ${[getTransactionPermission('1D'), getTransactionPermission('12M')]}
      ${'several permissions, all different apart from three identical permissions that arent consecutively placed'} | ${[getTransactionPermission('12M'), getTransactionPermission('1D'), getTransactionPermission('12M'), getTransactionPermission('8D'), getTransactionPermission('12M')]} | ${[getTransactionPermission('1D'), getTransactionPermission('12M'), getTransactionPermission('8D'), getTransactionPermission('12M')]}
    `('only remove one duplicate when $desc', async ({ transactionPermissions, result }) => {
      const setTransaction = jest.fn()
      const mockRequest = createMockRequest({
        transactionPermissions,
        setTransaction,
        currentTransactionPermission: getTransactionPermission('12M')
      })

      hasDuplicates.mockReturnValue(true)
      await updateTransaction(mockRequest)

      const newTransactionPermissions = setTransaction.mock.calls[0][0]
      expect(newTransactionPermissions.permissions).toStrictEqual(result)
    })
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
    const transactionPermissions = [
      { hash: 'abc-999', length: '12M' },
      { hash: 'aaa-111', length: '1D' },
      { hash: 'zzz-010', length: '8D' }
    ]
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
    const transactionPermissions = [
      { hash: 'abc-999', length: '12M' },
      { hash: 'aaa-111', length: '1D' },
      { hash: 'zzz-010', length: '8D' }
    ]
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

  it('hasDuplicates to be called with transaction.permissions', async () => {
    const transactionPermissions = [{ hash: 'abc-999', length: '12M' }]
    const setTransaction = jest.fn()
    const mockRequest = createMockRequest({
      transactionPermissions,
      setTransaction
    })

    await updateTransaction(mockRequest)
    expect(hasDuplicates).toHaveBeenCalledWith(transactionPermissions)
  })

  describe('all licences removed', () => {
    it('current permission of the status is not updated to the latest current permission', async () => {
      const transactionPermissions = []
      const setCurrentStatus = jest.fn()
      const mockRequest = createMockRequest({
        transactionPermissions,
        setCurrentStatus
      })

      await updateTransaction(mockRequest)

      expect(setCurrentStatus).toBeCalledTimes(0)
    })

    it('current permission of the status is not updated with updated currentPermissionIdx', async () => {
      const transactionPermissions = []
      const statusPermissions = [{ [REMOVE_LICENCE.page]: true, [ADD_LICENCE.page]: true }]
      const setStatus = jest.fn()

      const mockRequest = createMockRequest({
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
