import { getData } from '../route'
import { NEW_PRICES } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

jest.mock('../../../../processors/uri-helper.js')

describe('licence-to-start > route', () => {
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    })
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

    it.each([
      ['true', true],
      ['false', false],
      [undefined, false]
    ])('SHOW_NOTIFICATION_BANNER is set to value of process.env.SHOW_NOTIFICATION_BANNER', async (notification, expectedResult) => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      process.env.SHOW_NOTIFICATION_BANNER = notification
      const result = await getData(mockRequest)
      expect(result.SHOW_NOTIFICATION_BANNER).toEqual(expectedResult)
    })

    it('addLanguageCodeToUri is called with request and NEW_PRICES.uri', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      await getData(mockRequest)
      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, NEW_PRICES.uri)
    })
  })
})
