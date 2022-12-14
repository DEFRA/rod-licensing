import { NAME } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const VALID_PAYLOAD = {
  'first-name': 'Luke',
  'last-name': 'Skywalker'
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
      transaction: {
        get: jest.fn(),
        getCurrentPermission: jest.fn(() => ({ licensee: {} })),
        setCurrentPermission: jest.fn()
      }
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

  it.only('gets the licensee\'s current permission', async () => {
    const mockRequest = createRequestMock(VALID_PAYLOAD)
    await updateTransaction(mockRequest)
    expect(mockRequest.cache().helpers.transaction.getCurrentPermission).toBeCalled()
  })

  // it('gets the first name on the current permission', async () => {
  //   const mockRequest = createRequestMock(VALID_PAYLOAD)
  //   const [[permission]] = mockRequest.setCurrentPermission.mock.calls
  //   await updateTransaction(mockRequest)
  //   expect(permission.licensee.firstName).toBe(VALID_PAYLOAD['first-name'])
  // })

  // it('gets the last name on the current permission', async () => {
  //   const mockRequest = createRequestMock(VALID_PAYLOAD)
  //   const [[permission]] = mockRequest.setCurrentPermission.mock.calls
  //   await updateTransaction(mockRequest)
  //   expect(permission.licensee.lastName).toBe(VALID_PAYLOAD['first-name'])
  // })

  // it('assigns the licensee\'s first and last name into the fields if they exist', async () => {
  //   const mockRequest = createRequestMock(VALID_PAYLOAD)
  //   const [[permission]] = mockRequest.setCurrentPermission.mock.calls
  //   await updateTransaction(mockRequest)
  //   expect(permission.licensee.lastName).toBe(VALID_PAYLOAD['first-name'])
  // })

  // it('sets the first name on the current permission', async () => {
  //   const mockRequest = createRequestMock(VALID_PAYLOAD)
  //   const [[permission]] = mockRequest.setCurrentPermission.mock.calls
  //   await updateTransaction(mockRequest)
  //   expect(permission.licensee.firstName).toBe(VALID_PAYLOAD['first-name'])
  // })

  // it('sets the last name on the current permission', async () => {
  //   const mockRequest = createRequestMock(VALID_PAYLOAD)
  //   const [[permission]] = mockRequest.setCurrentPermission.mock.calls
  //   await updateTransaction(mockRequest)
  //   expect(permission.licensee.lastName).toBe(VALID_PAYLOAD['first-name'])
  // })
})
