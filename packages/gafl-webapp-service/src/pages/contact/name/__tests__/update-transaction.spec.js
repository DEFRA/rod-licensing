import { NAME } from '../../../../uri.js'
import updateTransaction from '../update-transaction.js'

const createRequestMock = ({
  getPageData = () => ({ payload: {} }),
  licenseeData = { licensee: {} },
  setCurrentPermission = () => {}
}) => ({
  cache: () => ({
    helpers: {
      page: {
        getCurrentPermission: getPageData
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
    const getPageData = jest.fn(() => ({ payload: {} }))
    await updateTransaction(createRequestMock({ getPageData }))
    expect(getPageData).toHaveBeenCalledWith(NAME.page)
  })

  it('sets current transaction permission to be value of transaction getCurrentPermission', async () => {
    const licenseeData = { licensee: { firstName: undefined, lastName: undefined } }
    const setCurrentPermission = jest.fn()
    const mockRequest = createRequestMock({ licenseeData, setCurrentPermission })
    await updateTransaction(mockRequest)
    expect(setCurrentPermission).toHaveBeenCalledWith(licenseeData)
  })

  it('sets current transaction permission first-name and last-name values to the payload values', async () => {
    const firstName = Symbol('Homer')
    const lastName = Symbol('Simpson')
    const samplePayload = { payload: { 'first-name': firstName, 'last-name': lastName } }
    const licenseeData = { licensee: { firstName: 'Anikan', lastName: 'Skywalker' } }
    const getPageData = () => samplePayload
    const mockRequest = createRequestMock({ getPageData, licenseeData })
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
