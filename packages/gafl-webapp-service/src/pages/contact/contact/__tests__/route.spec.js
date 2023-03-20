import { getData, validator } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'

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
jest.mock('../../../../processors/licence-type-display.js')

describe('name > route', () => {
  const getMockRequest = (isLicenceForYou = true) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => ({
            licensee: {
              birthDate: 'birthDate'
            },
            licenceLength: 'licenceLength',
            licenceStartDate: 'licenceStartDate',
            isLicenceForYou
          })
        }
      }
    })
  })

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const result = await getData(getMockRequest(true))
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const result = await getData(getMockRequest(false))
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it('return isPhysical as true, if isPhysical is true for the permission', async () => {
      isPhysical.mockReturnValueOnce(true)
      const result = await getData(getMockRequest())
      expect(result.isPhysical).toBeTruthy()
    })

    it('return isPhysical as false, if isPhysical is false for the permission', async () => {
      isPhysical.mockReturnValueOnce(false)
      const result = await getData(getMockRequest())
      expect(result.isPhysical).toBeFalsy()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with mock-contact-page, /mock/contact/page/uri, validator, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('mock-contact-page', '/mock/contact/page/uri', validator, nextPage, getData)
    })
  })
})
