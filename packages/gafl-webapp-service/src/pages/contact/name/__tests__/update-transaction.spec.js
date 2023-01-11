import { NAME } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const createRequestMock = (pageData, licenseeData, setCurrentPermission = jest.fn()) => ({
  cache: () => ({
    helpers: {
      page: {
        getCurrentPermission: pageData
      },
      transaction: {
        getCurrentPermission: () => licenseeData,
        setCurrentPermission
      }
    }
  })
})

describe('update-transaction', () => {
  beforeEach(jest.clearAllMocks)
  it('gets the payload from the name page cache', async () => {
    const samplePayload = { payload: { 'first-name': 'firstName', 'last-name': 'lastName' } }
    const licenseeData = { licensee: { firstName: 'Anikan', lastName: 'Skywalker' } }
    const getCurrentPermission = jest.fn(() => samplePayload)
    const mockRequest = createRequestMock(getCurrentPermission, licenseeData)
    await updateTransaction(mockRequest)
    expect(getCurrentPermission).toHaveBeenCalledWith(NAME.page)
  })

  it('sets current transaction permission to be value of transaction getCurrentPermission', async () => {
    const licenseeData = { licensee: {} }
    const setCurrentPermission = jest.fn()
    const getCurrentPermission = () => ({ payload: { firstName: '', lastName: '' } })
    const mockRequest = createRequestMock(getCurrentPermission, licenseeData, setCurrentPermission)
    await updateTransaction(mockRequest)
    expect(setCurrentPermission).toHaveBeenCalledWith(licenseeData)
  })

  it('sets sample permission first-name and last-name values to the payload values', async () => {
    const firstName = Symbol('Homer')
    const lastName = Symbol('Simpson')
    const samplePayload = { payload: { 'first-name': firstName, 'last-name': lastName } }
    const licenseeData = { licensee: { firstName: 'Anikan', lastName: 'Skywalker' } }
    const getCurrentPermission = () => samplePayload
    const mockRequest = createRequestMock(getCurrentPermission, licenseeData)
    await updateTransaction(mockRequest)
    expect(licenseeData).toEqual(
      expect.objectContaining({
        licensee: {
          firstName,
          lastName
        }
      })
    )
  })
})
