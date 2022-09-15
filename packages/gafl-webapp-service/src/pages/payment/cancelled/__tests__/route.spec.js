import { NEW_TRANSACTION } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { COMPLETION_STATUS } from '../../../../constants.js'

beforeEach(jest.clearAllMocks)
jest.mock('../../../../processors/uri-helper.js')

const mockStatusCacheGet = jest.fn()

const mockRequest = {
  cache: () => ({
    helpers: {
      status: {
        get: mockStatusCacheGet
      }
    }
  })
}

describe('getData', () => {
  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    mockStatusCacheGet.mockImplementationOnce(() => ({
      [COMPLETION_STATUS.paymentCreated]: true
    }))

    await getData(mockRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, NEW_TRANSACTION.uri)
  })

  it('getData returns correct URI', async () => {
    mockStatusCacheGet.mockImplementationOnce(() => ({
      [COMPLETION_STATUS.paymentCreated]: true
    }))

    const expectedUri = Symbol('decorated uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

    const result = await getData(mockRequest)
    expect(result.uri.new).toEqual(expectedUri)
  })
})
