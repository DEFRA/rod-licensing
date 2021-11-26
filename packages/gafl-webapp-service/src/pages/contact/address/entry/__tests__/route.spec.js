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
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        addressLookup: {
          getCurrentPermission: jest.fn(() => ({}))
        }
      }
    })
  }

  describe('getData', () => {
    it('should return pronoun as your, if isLicenceForYou is true on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toBe('your')
    })

    it('should return pronoun as their, if isLicenceForYou is false on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toBe('their')
    })
  })

  describe('default', () => {
    it('should call the pageRoute with address-entry, /buy/address, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('address-entry', '/buy/address', validator, nextPage, getData)
    })
  })
})
