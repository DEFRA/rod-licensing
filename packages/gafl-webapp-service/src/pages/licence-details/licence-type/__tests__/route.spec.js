import { getData, validator } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import '../../../../processors/pricing-summary.js'

jest.mock('../../../../routes/next-page.js')
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../processors/pricing-summary.js')

describe('licence-type > route', () => {
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
      mockTransactionCacheGet.mockImplementationOnce(() => ({ concessions: [], isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ concessions: [], isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with licence-type, /buy/licence-type, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('licence-type', '/buy/licence-type', validator, nextPage, getData)
    })
  })
})
