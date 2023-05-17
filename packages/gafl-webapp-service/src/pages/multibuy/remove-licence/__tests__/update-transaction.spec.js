import updateTransaction from '../update-transaction.js'

const createNewPermission = ({
  firstName = 'Turanga',
  lastName = 'Leela',
  licenceType = 'trout-and-coarse',
  numberOfRods = '2',
  licenceToStart = 'after-payment',
  licenceLength = '12M',
  cost = 12
} = {}) => ({
  licensee: {
    firstName,
    lastName
  },
  licenceType,
  numberOfRods,
  licenceToStart,
  licenceLength,
  permit: { cost }
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
      permissions: [createNewPermission(), createNewPermission({ firstName: 'Bobby' }), createNewPermission({ licenceLength: '8 days' })]
    }
    const mockRequest = createRequestMock(transaction, createNewPermission(), set)
    await updateTransaction(mockRequest)
    expect(set).toHaveBeenCalledWith(expect.objectContaining(transaction))
  })

  describe('transaction after remove licence', () => {
    it('transaction does not contain the currentPermission', async () => {
      const permissionToRemove = createNewPermission({ licenceType: 'salmon-and-sea' })
      const transaction = { permissions: [createNewPermission(), permissionToRemove, createNewPermission()] }
      const mockRequest = createRequestMock(transaction, permissionToRemove)
      await updateTransaction(mockRequest)
      const permissions = transaction.permissions
      expect(permissions.filter(p => p.licenceType === 'salmon-and-sea').length).toEqual(0)
    })

    it.each([[createNewPermission(), createNewPermission({ firstName: 'Brie' }), createNewPermission()]])(
      'only deletes one entry of a duplicate permission',
      async (permissionOne, permissionTwo, permissionThreeToRemove) => {
        const transaction = { permissions: [permissionOne, permissionTwo, permissionThreeToRemove] }
        const expectedResult = [permissionTwo, permissionOne]
        const mockRequest = createRequestMock(transaction, permissionThreeToRemove)
        await updateTransaction(mockRequest)
        const permissions = transaction.permissions
        expect(permissions).toEqual(expectedResult)
      }
    )
  })
})
