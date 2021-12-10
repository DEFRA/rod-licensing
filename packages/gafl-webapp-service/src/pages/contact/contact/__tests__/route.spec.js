import { getData, validator } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'

jest.mock('../../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../uri.js', () => ({
  ...jest.requireActual('../../../../uri.js'),
  CONTACT: {
    page: 'mock-contact-page',
    uri: '/mock/contact/page/uri'
  }
}))

describe('name > route', () => {
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: async () => ({
            licensee: {
              birthDate: 'birthDate'
            },
            licenceLength: 'licenceLength',
            licenceStartDate: 'licenceStartDate'
          })
        },
        status: {
          getCurrentPermission: mockStatusCacheGet
        }
      }
    })
  }

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with date-of-birth, /buy/date-of-birth, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('mock-contact-page', '/mock/contact/page/uri', validator, nextPage, getData)
    })
  })
})
