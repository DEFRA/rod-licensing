import { getData, validator } from '../route'
import pageRoute from '../../../../../routes/page-route.js'
import { nextPage } from '../../../../../routes/next-page.js'
import '../../../../../processors/refdata-helper.js'

jest.mock('../../../../../processors/refdata-helper.js', () => ({
  countries: {
    getAll: jest.fn(() => [])
  }
}))
jest.mock('../../../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../../../routes/page-route.js')

describe('address-entry > route', () => {
  const mockTransctionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransctionCacheGet
        },
        addressLookup: {
          getCurrentPermission: jest.fn(() => ({}))
        }
      }
    })
  }

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      mockTransctionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      mockTransctionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with address-entry, /buy/address, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('address-entry', '/buy/address', validator, nextPage, getData)
    })
  })
})
