import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { getData } from '../route'
import { LICENCE_TO_START } from '../../../../uri.js'
import { startDateValidator } from '../../../../schema/validators/validators.js'

jest.mock('../../../../routes/next-page.js')
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../schema/validators/validators.js')
jest.mock('../../../../uri.js', () => ({
  ...jest.requireActual('../../../../uri.js'),
  LICENCE_TO_START: {
    page: Symbol('licence-to-start-page'),
    uri: Symbol('/licence-to-start')
  }
}))

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
  })

  describe('default', () => {
    it('should call the pageRoute with date-of-birth, /buy/date-of-birth, dateOfBirthValidator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith(LICENCE_TO_START.page, LICENCE_TO_START.uri, startDateValidator, nextPage, getData)
    })
  })
})
