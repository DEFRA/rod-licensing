import { getData, validator } from '../route'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { LICENCE_SUMMARY, CONTACT_SUMMARY } from '../../../uri.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'
import { LICENCE_TYPE } from '../../../processors/mapping-constants.js'

jest.mock('../../../processors/mapping-constants.js', () => ({
  LICENCE_TYPE: {
    'trout-and-coarse': 'Test trout and coarse',
    'salmon-and-sea-trout': 'Test Salmon'
  }
}))

jest.mock('../../../routes/page-route.js')

jest.mock('../../../processors/licence-type-display.js', () => ({
  licenceTypeDisplay: jest.fn()
}))

const getMockPermission = (price, type, rods) => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: type,
  numberOfRods: rods,
  licenceLength: '8D',
  permit: { cost: price }
})

const catalog = Symbol('mock catalog')

const generateMockRequest = (transactionGet = {}, statusGet = { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true }) => ({
  cache: () => ({
    helpers: {
      transaction: {
        get: async () => transactionGet
      },
      status: {
        getCurrentPermission: async () => statusGet
      }
    }
  }),
  i18n: {
    getCatalog: () => catalog
  }
})

describe('terms-and-conditions > route', () => {
  describe('default', () => {
    it('should call the pageRoute with terms-and-conditions, /buy/conditions, validator, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('terms-and-conditions', '/buy/conditions', validator, nextPage, getData)
    })
  })

  describe('getData', () => {
    beforeEach(() => jest.clearAllMocks())

    it('LICENCE_SUMMARY redirect', async () => {
      const func = () => getData(generateMockRequest({}, { [LICENCE_SUMMARY.page]: false }))
      await expect(func).rejects.toThrowRedirectTo(LICENCE_SUMMARY.uri)
    })

    it('CONTACT_SUMMARY redirect', async () => {
      const func = () => getData(generateMockRequest({}, { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: false }))
      await expect(func).rejects.toThrowRedirectTo(CONTACT_SUMMARY.uri)
    })

    it.each([
      [0, 24, true],
      [12, 0, true],
      [1, 14, true],
      [0, 0, false]
    ])('returns whether payment is required', async (price, anotherPrice, paymentRequired) => {
      const data = await getData(
        generateMockRequest(
          { permissions: [getMockPermission(price), getMockPermission(anotherPrice)] },
          { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true }
        )
      )
      expect(data.paymentRequired).toBe(paymentRequired)
    })

    const salmonAndSeaTrout = 'Salmon'

    it('licenceTypeDisplay is called with permission and catalog', async () => {
      const permission = getMockPermission(10, salmonAndSeaTrout)
      await getData(generateMockRequest({ permissions: [permission] }))

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    const getSamplePermissions = (type, rods) => {
      return [getMockPermission(1, type, rods), getMockPermission(1, type, rods), getMockPermission(0, 'type', '4')]
    }

    const mockGetData = async (type, rods) => {
      return await getData(
        generateMockRequest({
          permissions: getSamplePermissions(type, rods)
        })
      )
    }

    describe.each([
      [LICENCE_TYPE['trout-and-coarse'], '2', false],
      [LICENCE_TYPE['trout-and-coarse'], '3', false],
      [LICENCE_TYPE['salmon-and-sea-trout'], '1', true]
    ])('testing whether correct type is set to display', (type, rods, salmonFlag) => {
      it('returns whether to display Salmon and sea trout conditions', async () => {
        const result = await mockGetData(type, rods)
        expect(result.isSalmonAndSeaTrout).toBe(salmonFlag)
      })
    })
  })
})
