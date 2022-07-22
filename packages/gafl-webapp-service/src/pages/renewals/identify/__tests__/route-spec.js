import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { NEW_TRANSACTION } from '../../../../uri.js'

jest.mock('../../../../processors/uri-helper.js')

const mockStatusCacheGet = jest.fn()
const mockStatusCacheSet = jest.fn()

const mockRequest = {
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: mockStatusCacheGet,
        setCurrentPermission: mockStatusCacheSet
      }
    }
  }),
  url: {
    search: ''
  }
}

describe('getData', () => {
  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    mockStatusCacheGet.mockImplementationOnce(() => ({ referenceNumber: '013AH6' }))
    await getData(mockRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, NEW_TRANSACTION.uri)
  })
})
