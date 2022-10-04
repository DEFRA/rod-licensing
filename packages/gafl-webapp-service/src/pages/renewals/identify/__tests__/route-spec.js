import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { NEW_TRANSACTION } from '../../../../uri.js'

jest.mock('../../../../processors/uri-helper.js')

const getMockRequest = () => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: () => ({
          referenceNumber: '013AH6'
        })
      }
    }
  })
})

describe('getData', () => {
  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    const request = getMockRequest()
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, NEW_TRANSACTION.uri)
  })

  it('getData returns correct URI', async () => {
    const expectedUri = Symbol('decorated uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

    const result = await getData(getMockRequest())
    expect(result.uri.new).toEqual(expectedUri)
  })
})
