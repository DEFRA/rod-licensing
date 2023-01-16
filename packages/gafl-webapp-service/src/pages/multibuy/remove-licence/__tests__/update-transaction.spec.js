import updateTransaction from '../update-transaction.js'

const getPermissionOne = () => ({
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

const getPermissionTwo = () => ({
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

const getPermissionThree = () => ({
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

const createRequestMock = (transaction, permission, set = jest.fn()) => ({
  cache: () => ({
    helpers: {
      transaction: {
        get: async () => transaction,
        set,
        getCurrentPermission: async () => permission
      }
    }
  })
})

describe('remove-licence > update transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('set is being called with a permission removed', async () => {
    const set = jest.fn()
    const transaction = {
      permissions: [getPermissionOne(), getPermissionTwo(), getPermissionThree()]
    }
    const mockRequest = createRequestMock(transaction, getPermissionTwo(), set)
    await updateTransaction(mockRequest)
    expect(set).toHaveBeenCalledWith(expect.objectContaining(transaction))
  })

  describe('transaction after remove licence', () => {
    const transaction = {
      permissions: [getPermissionOne(), getPermissionTwo(), getPermissionThree()]
    }
    const mockRequest = createRequestMock(transaction, getPermissionTwo())

    it('transaction removes a permission', async () => {
      await updateTransaction(mockRequest)
      expect(transaction.permissions.length).toEqual(2)
    })

    it('transaction does not contain the currentPermission', async () => {
      await updateTransaction(mockRequest)
      const permissions = transaction.permissions
      expect(permissions.filter(p => p.licenceType === 'salmon-and-sea').length).toEqual(0)
    })

    it('transaction contains permissions other than currentPermission', async () => {
      await updateTransaction(mockRequest)
      const permissions = transaction.permissions
      expect(permissions.filter(p => p.licenceType === 'trout-and-coarse').length).toEqual(2)
    })
  })
})
