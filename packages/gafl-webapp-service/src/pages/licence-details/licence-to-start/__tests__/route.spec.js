import { getData } from '../route'
import { NEW_PRICES } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

jest.mock('../../../../processors/uri-helper.js')

describe('licence-to-start > route', () => {
  const getMockRequest = (isLicenceForYou = true) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => ({
            isLicenceForYou
          })
        }
      }
    })
  })

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const request = getMockRequest()
      const result = await getData(request)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const request = getMockRequest(false)
      const result = await getData(request)
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it.each([
      ['true', true],
      ['false', false],
      [undefined, false]
    ])('SHOW_NOTIFICATION_BANNER is set to value of process.env.SHOW_NOTIFICATION_BANNER', async (notification, expectedResult) => {
      process.env.SHOW_NOTIFICATION_BANNER = notification
      const request = getMockRequest()
      const result = await getData(request)
      expect(result.SHOW_NOTIFICATION_BANNER).toEqual(expectedResult)
    })

    it('addLanguageCodeToUri is called with request and NEW_PRICES.uri', async () => {
      const request = getMockRequest()
      await getData(request)
      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, NEW_PRICES.uri)
    })
  })
})
