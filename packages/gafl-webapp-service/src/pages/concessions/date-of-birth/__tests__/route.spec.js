import { getData, validator, checkBeenLicenceFor } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { LICENCE_FOR } from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'

jest.mock('../../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../../routes/page-route.js')

describe('name > route', () => {
  const mockRequest = (statusGet = () => {}, transactionGet = () => {}) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: transactionGet
        },
        status: {
          getCurrentPermission: statusGet
        }
      }
    })
  })

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const transaction = () => ({
        isLicenceForYou: true
      })
      const status = () => ({
        [LICENCE_FOR.page]: true
      })
      const result = await getData(mockRequest(status, transaction))
      expect(result.isLicenceForYou).toBeTruthy()
    })
  })

  describe('checkBeenLicenceFor', () => {
    it('should throw a redirect if not been to LICENCE_FOR page', async () => {
      const status = () => ({
        [LICENCE_FOR.page]: false
      })
      expect(() => checkBeenLicenceFor(status)).toThrow(GetDataRedirect)
    })
  })

  describe('default', () => {
    it('should call the pageRoute with date-of-birth, /buy/date-of-birth, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('date-of-birth', '/buy/date-of-birth', validator, nextPage, getData)
    })
  })
})
