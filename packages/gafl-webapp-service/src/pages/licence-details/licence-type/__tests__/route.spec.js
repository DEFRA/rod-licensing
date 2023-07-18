import { getData, validator } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { LICENCE_TYPE } from '../../../../uri.js'
import { pricingDetail } from '../../../../processors/pricing-summary.js'
import { hasJunior } from '../../../../processors/concession-helper.js'

jest.mock('../../../../routes/next-page.js')
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../processors/pricing-summary.js')
jest.mock('../../../../processors/concession-helper.js')

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

describe('licence-type > route', () => {
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

    it.each([['true'], ['false']])('should return hasJunior as %s, if concessionHelper.hasJunior is %s', async junior => {
      hasJunior.mockReturnValue(junior)
      const mockRequest = createMockRequest()
      const result = await getData(mockRequest)
      expect(result.hasJunior).toEqual(junior)
    })

    it('return value of pricingDetail is used for pricing', async () => {
      const pricing = Symbol('mock pricing')
      pricingDetail.mockReturnValue(pricing)
      const mockRequest = createMockRequest()
      const result = await getData(mockRequest)
      expect(result.pricing).toEqual(pricing)
    })

    it('pricingDetail is called with licence type page, permission and catalog', async () => {
      const catalog = Symbol('mock catalog')
      const permission = Symbol('mock permission')
      const mockRequest = createMockRequest({ permission, catalog })
      await getData(mockRequest)

      expect(pricingDetail).toHaveBeenCalledWith(LICENCE_TYPE.page, permission, catalog)
    })

    it('hasJunior is called with permission', async () => {
      const permission = Symbol('mock permission')
      const mockRequest = createMockRequest({ permission })
      await getData(mockRequest)

      expect(hasJunior).toHaveBeenCalledWith(permission)
    })

    it('getData returns expected output', async () => {
      hasJunior.mockReturnValue(true)
      pricingDetail.mockReturnValue('test')
      const permission = Symbol('mock permission')
      const mockRequest = createMockRequest({ permission })
      const result = await getData(mockRequest)

      expect(result).toMatchSnapshot()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with licence-type, /buy/licence-type, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('licence-type', '/buy/licence-type', validator, nextPage, getData)
    })
  })
})
