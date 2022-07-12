import { getData } from '../route'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import { ADDRESS_LOOKUP } from '../../../../../uri.js'

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

    it('should return the addressLookup page uri', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        licenceStartDate: '2021-07-01',
        numberOfRods: '3',
        licenceType: 'Salmon and sea trout',
        licenceLength: '12M',
        licensee: {
          firstName: 'Graham',
          lastName: 'Willis',
          birthDate: '1946-01-01'
        },
        permit: {
          cost: 6
        }
      }))

      const returnValue = Symbol('return value')
      addLanguageCodeToUri.mockReturnValueOnce(returnValue)

      const result = await getData(mockRequest)
      const ret = result.lookupPage

      expect(ret).toEqual(returnValue)
    })

    it('addLanguageCodeToUri is called with the expected arguments for address lookup', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))

      await getData(mockRequest)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, ADDRESS_LOOKUP.uri)
    })
  })
})
