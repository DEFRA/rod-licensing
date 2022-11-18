import { getData, validator } from '../route'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { LICENCE_SUMMARY, CONTACT_SUMMARY } from '../../../uri.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'

jest.mock('../../../routes/page-route.js')

jest.mock('../../../processors/licence-type-display.js', () => ({
  licenceTypeDisplay: jest.fn()
}))

const getMockPermission = (price, type) => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: type,
  numberOfRods: '2',
  licenceLength: '8D',
  permit: { cost: price }
})

describe('terms-and-conditions > route', () => {
  describe('default', () => {
    it('should call the pageRoute with terms-and-conditions, /buy/conditions, validator, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('terms-and-conditions', '/buy/conditions', validator, nextPage, getData)
    })
  })

  describe('getData', () => {
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
        getCatalog: () => ({})
      }
    })

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

    const troutAndCoarse2Rods = 'Trout and coarse, up to 2 rods'
    const troutAndCoarse3Rods = 'Trout and coarse, up to 3 rods'
    const salmonAndSeaTrout = 'Salmon and sea trout'

    it.each([
      [troutAndCoarse2Rods, true],
      [troutAndCoarse3Rods, false],
      [salmonAndSeaTrout, false]
    ])('returns whether should display Trout and coarse, up to 2 rods conditions', async (type, displayType) => {
      const mockLicenceTypeReturn = licenceTypeDisplay.mockReturnValue(type)
      const mockLicenceTypeReturn3Rods = licenceTypeDisplay.mockReturnValueOnce(troutAndCoarse3Rods)
      const data = await getData(
        generateMockRequest(
          { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true },
          {
            permissions: [
              getMockPermission(1, mockLicenceTypeReturn),
              getMockPermission(1, mockLicenceTypeReturn),
              getMockPermission(0, mockLicenceTypeReturn3Rods)
            ]
          }
        )
      )
      expect(data.troutAndCoarse2Rods).toBe(displayType)
    })

    it.each([
      [troutAndCoarse2Rods, false],
      [troutAndCoarse3Rods, true],
      [salmonAndSeaTrout, false]
    ])('returns whether should display Trout and coarse, up to 3 rods conditions', async (type, displayType) => {
      const mockLicenceTypeReturn = licenceTypeDisplay.mockReturnValue(type)
      const mockLicenceTypeReturn2Rods = licenceTypeDisplay.mockReturnValueOnce(troutAndCoarse2Rods)
      const data = await getData(
        generateMockRequest(
          { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true },
          {
            permissions: [
              getMockPermission(1, mockLicenceTypeReturn),
              getMockPermission(1, mockLicenceTypeReturn),
              getMockPermission(0, mockLicenceTypeReturn2Rods)
            ]
          }
        )
      )
      expect(data.troutAndCoarse3Rods).toBe(displayType)
    })

    it.each([
      [troutAndCoarse2Rods, false],
      [troutAndCoarse3Rods, false],
      [salmonAndSeaTrout, true]
    ])('returns whether should display Salmon and sea trout conditions', async (type, displayType) => {
      const mockLicenceTypeReturn = licenceTypeDisplay.mockReturnValue(type)
      const mockLicenceTypeReturn2Rods = licenceTypeDisplay.mockReturnValueOnce(troutAndCoarse2Rods)
      const data = await getData(
        generateMockRequest(
          { [LICENCE_SUMMARY.page]: true, [CONTACT_SUMMARY.page]: true },
          {
            permissions: [
              getMockPermission(1, mockLicenceTypeReturn),
              getMockPermission(1, mockLicenceTypeReturn),
              getMockPermission(0, mockLicenceTypeReturn2Rods)
            ]
          }
        )
      )

      expect(data.salmonAndSeaTrout).toBe(displayType)
    })
  })
})
