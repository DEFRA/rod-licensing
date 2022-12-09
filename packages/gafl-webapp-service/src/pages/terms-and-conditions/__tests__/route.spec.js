import { getData, validator } from '../route'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { LICENCE_SUMMARY, CONTACT_SUMMARY } from '../../../uri.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'

jest.mock('../../../processors/mapping-constants.js', () => ({
  LICENCE_TYPE: {
    'trout-and-coarse': 'Trout and coarse',
    'salmon-and-sea-trout': 'Salmon and sea trout'
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

const generateMockRequest = (statusGet = {}, transactionGet = {}) => ({
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
      const func = () => getData(generateMockRequest({ [LICENCE_SUMMARY.page]: false }))
      await expect(func).rejects.toThrowRedirectTo(LICENCE_SUMMARY.uri)
    })

    it('CONTACT_SUMMARY redirect', async () => {
      const func = () => getData(generateMockRequest({ [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: false }))
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
          { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true },
          { permissions: [getMockPermission(price), getMockPermission(anotherPrice)] }
        )
      )
      expect(data.paymentRequired).toBe(paymentRequired)
    })

    it('test licenceTypeDisplay is called with permission and mssgs', async () => {
      const func = () => getData(generateMockRequest({ [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: false }))
      await expect(func).rejects.toThrowRedirectTo(CONTACT_SUMMARY.uri)
    })

    const troutAndCoarse2Rods = 'Trout and coarse, up to 2 rods'
    const troutAndCoarse3Rods = 'Trout and coarse, up to 3 rods'
    const salmonAndSeaTrout = 'Salmon and sea trout'

    it.each([[troutAndCoarse2Rods], [troutAndCoarse3Rods], [salmonAndSeaTrout]])(
      'licenceTypeDisplay is called with permission and catalog',
      async type => {
        const permission = getMockPermission(10, type)
        await getData(
          generateMockRequest(
            { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true },
            {
              permissions: [permission]
            }
          )
        )

        expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
      }
    )

    describe.each([
      ['Trout and coarse', '2', true, false, false],
      ['Trout and coarse', '3', false, true, false],
      ['Salmon and sea trout', '1', false, false, true]
    ])('testing whether correct type is set to display', (type, rods, troutTwoFlag, troutThreeFlag, salmonFlag) => {
      let data
      beforeEach(async () => {
        data = await getData(
          generateMockRequest(
            { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true },
            {
              permissions: [getMockPermission(1, type, rods), getMockPermission(1, type, rods), getMockPermission(0, 'type', '4')]
            }
          )
        )
      })

      it('returns whether to display Trout and coarse, up to 2 rods conditions', async () => {
        expect(data.troutAndCoarse2Rods).toBe(troutTwoFlag)
      })

      it('returns whether to display Trout and coarse, up to 3 rods conditions', async () => {
        expect(data.troutAndCoarse3Rods).toBe(troutThreeFlag)
      })

      it('returns whether to display Salmon and sea trout conditions', async () => {
        expect(data.salmonAndSeaTrout).toBe(salmonFlag)
      })
    })
  })
})
