import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { NEW_TRANSACTION } from '../../../../uri.js'

jest.mock('../../../../processors/uri-helper.js')

const getMockRequest = referenceNumber => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: () => ({
          referenceNumber: referenceNumber
        })
      }
    }
  })
})

describe('getData', () => {
  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    const request = getMockRequest('013AH6')
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, NEW_TRANSACTION.uri)
  })

  it('getData returns correct URI', async () => {
    const expectedUri = Symbol('decorated uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

    const result = await getData(getMockRequest('013AH6'))
    expect(result.uri.new).toEqual(expectedUri)
  })

  it.each([['09F6VF'], ['013AH6'], ['LK563F']])('getData returns referenceNumber', async referenceNumber => {
    const result = await getData(getMockRequest(referenceNumber))
    expect(result.referenceNumber).toEqual(referenceNumber)
  })
})
