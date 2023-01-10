import { NAME } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const createRequestMock = (currentPermission, samplePermission, setCurrentPermission = jest.fn()) => ({
  cache: () => ({
    helpers: {
      page: {
        getCurrentPermission: () => currentPermission
      },
      transaction: {
        getCurrentPermission: () => samplePermission,
        setCurrentPermission
      }
    }
  })
})

describe('update-transaction', () => {
  beforeEach(jest.clearAllMocks)
  it('sets current transaction permission to be value of transaction getCurrentPermission', async () => {
    const samplePermission = { licensee: {} }
    const setCurrentPermission = jest.fn()
    const mockRequest = createRequestMock({ payload: { firstName: '', lastName: '' } }, samplePermission, setCurrentPermission)
    await updateTransaction(mockRequest)
    expect(setCurrentPermission).toHaveBeenCalledWith(samplePermission)
  })

  it('sets sample permission first-name and last-name values to the payload values', async () => {
    const firstName = Symbol('Homer')
    const lastName = Symbol('Simpson')
    const samplePayload = { payload: { 'first-name': firstName, 'last-name': lastName } }
    const samplePermission = { licensee: { firstName: 'Anikan', lastName: 'Skywalker' } }
    const mockRequest = createRequestMock(samplePayload, samplePermission)
    await updateTransaction(mockRequest)
    expect(samplePermission).toEqual(expect.objectContaining({
      licensee: {
        firstName,
        lastName
      }
    }))
  })

  it('gets the payload from the name page cache', async () => {
    const samplePayload = { payload: { 'first-name': 'Howard', 'last-name': 'Moon' }}
    const getCurrentPermission = jest.fn(() => ({ payload: samplePayload }))
    const mockRequest = createRequestMock(getCurrentPermission, samplePayload)
    await updateTransaction(mockRequest)
    expect(getCurrentPermission).toHaveBeenCalledWith(NAME.page)
  })
})
