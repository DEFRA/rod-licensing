import { getData } from '../route'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import { ADDRESS_ENTRY } from '../../../../../uri.js'

jest.mock('../../../../../processors/uri-helper.js')

describe('address-select > route', () => {
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        },
        addressLookup: {
          getCurrentPermission: jest.fn(() => ({}))
        }
      }
    }),
    url: {
      search: ''
    }
  }

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it('addLanguageCodeToUri is called with the expected arguments for manual address entry', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))

      await getData(mockRequest)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, ADDRESS_ENTRY.uri)
    })
  })
})
