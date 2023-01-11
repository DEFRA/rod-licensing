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

const set = jest.fn()

const createRequestMock = (transaction, permission) => ({
  cache: () => ({
    helpers: {
      transaction: {
        get: async () => transaction,
        set: set,
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
    const transaction = {
      permissions: [getPermissionOne(), getPermissionTwo(), getPermissionThree()]
    }
    const result = {
      permissions: [getPermissionOne(), getPermissionThree()]
    }
    const mockRequest = createRequestMock(transaction, getPermissionTwo())
    await updateTransaction(mockRequest)
    expect(set).toHaveBeenCalledWith(result)
  })
})
