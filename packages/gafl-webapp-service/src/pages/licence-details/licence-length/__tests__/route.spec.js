import { getData } from '../route'
import { pricingDetail } from '../../../../processors/pricing-summary.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { LICENCE_LENGTH } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'

jest.mock('../../../../routes/next-page.js')
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../processors/pricing-summary.js')
jest.mock('../../../../processors/licence-type-display.js')

const createMockRequest = ({ permission = () => {}, catalog = () => {} } = {}) => ({
  cache: () => ({
    helpers: {
      transaction: {
        getCurrentPermission: () => permission
      }
    }
  }),
  i18n: {
    getCatalog: () => catalog
  }
})

describe('licence-length > route', () => {
  describe('getData', () => {
    it.each([['true'], ['false']])(
      'should return isLicenceForYou as %s, if isLicenceForYou is %s on the transaction cache',
      async isLicenceForYou => {
        const permission = { concessions: [], isLicenceForYou }
        const mockRequest = createMockRequest({ permission })
        const result = await getData(mockRequest)
        expect(result.isLicenceForYou).toEqual(isLicenceForYou)
      }
    )

    it('licenceTypeDisplay is called with the expected arguments', async () => {
      const catalog = Symbol('mock catalog')
      const permission = Symbol('mock permission')
      const mockRequest = createMockRequest({ permission, catalog })

      await getData(mockRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const returnValue = Symbol('return value')
      licenceTypeDisplay.mockReturnValueOnce(returnValue)
      const mockRequest = createMockRequest({})

      const result = await getData(mockRequest)
      const ret = result.licenceTypeStr

      expect(ret).toEqual(returnValue)
    })

    it('pricingDetail is called with licence type page, permission and catalog', async () => {
      const catalog = Symbol('mock catalog')
      const permission = Symbol('mock permission')
      const mockRequest = createMockRequest({ permission, catalog })
      await getData(mockRequest)

      expect(pricingDetail).toHaveBeenCalledWith(LICENCE_LENGTH.page, permission, catalog)
    })

    it('return value of pricingDetail is used for pricing', async () => {
      const returnValue = Symbol('return value')
      pricingDetail.mockReturnValueOnce(returnValue)
      const mockRequest = createMockRequest({})

      const result = await getData(mockRequest)
      const ret = result.pricing

      expect(ret).toEqual(returnValue)
    })
  })

  describe('default', () => {
    it('should call the pageRoute with licence-length, /buy/licence-length, validator and nextPage', async () => {
      const validator = pageRoute.mock.calls[0][2]
      expect(pageRoute).toBeCalledWith('licence-length', '/buy/licence-length', validator, nextPage, getData)
    })
  })
})
