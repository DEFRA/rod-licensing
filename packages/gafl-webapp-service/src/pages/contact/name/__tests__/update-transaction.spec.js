import { NAME } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const VALID_PAYLOAD = (firstName = 'Luke', lastName = 'Skywalker') => ({
  'first-name': firstName,
  'last-name': lastName
})

const transactionHelperMock = {
  get: jest.fn(),
  getCurrentPermission: jest.fn(() => ({ licensee: { firstName: null, lastName: null } })),
  setCurrentPermission: jest.fn()
}

const createRequestMock = getCurrentPermission => ({
  cache: jest.fn(() => ({
    helpers: {
      page: {
        get: jest.fn(() => ({
          permissions: [
            {
              [NAME.page]: {
                payload: VALID_PAYLOAD
              }
            }
          ]
        })),
        getCurrentPermission
      },
      status: {
        get: jest.fn()
      },
      transaction: transactionHelperMock
    }
  }))
})

describe('update-transaction', () => {
  beforeEach(jest.clearAllMocks)
  it('gets the payload from the name page cache', async () => {
    const samplePayload = {
      'first-name': 'Barry',
      'last-name': 'Chuckle'
    }
    const getCurrentPermission = jest.fn(() => ({ payload: samplePayload }))
    const mockRequest = createRequestMock(getCurrentPermission)
    await updateTransaction(mockRequest)
    expect(getCurrentPermission).toHaveBeenCalledWith(NAME.page)
  })

  it('sets the first name on the current permission', async () => {
    const samplePayload = VALID_PAYLOAD()
    const getCurrentPermission = jest.fn(() => ({ payload: samplePayload }))
    const mockRequest = createRequestMock(getCurrentPermission)
    const permission = transactionHelperMock.setCurrentPermission.mock.calls
    await updateTransaction(mockRequest)
    expect(permission[0][0].licensee.firstName).toBe(VALID_PAYLOAD()['first-name'])
  })

  it('sets the last name on the current permission', async () => {
    const samplePayload = VALID_PAYLOAD()
    const getCurrentPermission = jest.fn(() => ({ payload: samplePayload }))
    const mockRequest = createRequestMock(getCurrentPermission)
    const permission = transactionHelperMock.setCurrentPermission.mock.calls
    await updateTransaction(mockRequest)
    expect(permission[0][0].licensee.lastName).toBe(VALID_PAYLOAD()['last-name'])
  })

  it('compare if has set first and last name for licensee based off payload', async () => {
    const samplePayload = VALID_PAYLOAD()
    const getCurrentPermission = jest.fn(() => ({ payload: samplePayload }))
    const mockRequest = createRequestMock(getCurrentPermission)
    const noNameLicensee = transactionHelperMock.getCurrentPermission.mock.calls
    const nameLicensee = transactionHelperMock.setCurrentPermission.mock.calls
    await updateTransaction(mockRequest)
    expect(noNameLicensee[0][0]).not.toBe(nameLicensee[0][0])
  })
})
