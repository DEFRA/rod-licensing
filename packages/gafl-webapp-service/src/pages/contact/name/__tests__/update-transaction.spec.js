import { NAME } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const VALID_PAYLOAD = {
  'first-name': 'Luke',
  'last-name': 'Skywalker'
}

const transactionHelperMock = {
  get: jest.fn(),
  getCurrentPermission: jest.fn(() => ({ licensee: { firstName: null, lastName: null } })),
  setCurrentPermission: jest.fn()
}

const createRequestMock = payload => ({
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
        getCurrentPermission: jest.fn(() => ({ payload: payload || { test: 'payload' } }))
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
    const mockRequest = createRequestMock(VALID_PAYLOAD)
    await updateTransaction(mockRequest)
    expect(mockRequest.cache.mock.results[0].value.helpers.page.getCurrentPermission).toBeCalledWith(NAME.page)
  })

  it('gets the licensee', async () => {
    const mockRequest = createRequestMock(VALID_PAYLOAD)
    await updateTransaction(mockRequest)
    expect(mockRequest.cache.mock.results[0].value.helpers.transaction.getCurrentPermission).toBeCalled()
  })

  it('sets the first name on the current permission', async () => {
    const mockRequest = createRequestMock(VALID_PAYLOAD)
    const permission = transactionHelperMock.setCurrentPermission.mock.calls
    await updateTransaction(mockRequest)
    expect(permission[0][0].licensee.firstName).toBe(VALID_PAYLOAD['first-name'])
  })

  it('sets the last name on the current permission', async () => {
    const mockRequest = createRequestMock(VALID_PAYLOAD)
    const permission = transactionHelperMock.setCurrentPermission.mock.calls
    await updateTransaction(mockRequest)
    expect(permission[0][0].licensee.lastName).toBe(VALID_PAYLOAD['last-name'])
  })

  it('compare if has set first and last name for licensee based off payload', async () => {
    const mockRequest = createRequestMock(VALID_PAYLOAD)
    const noNameLicensee = transactionHelperMock.getCurrentPermission.mock.calls
    const nameLicensee = transactionHelperMock.setCurrentPermission.mock.calls
    await updateTransaction(mockRequest)
    expect(noNameLicensee[0][0]).not.toBe(nameLicensee[0][0])
  })
})
