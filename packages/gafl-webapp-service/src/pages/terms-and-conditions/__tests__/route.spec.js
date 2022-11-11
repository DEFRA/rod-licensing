import { getData, validator } from '../route'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { LICENCE_SUMMARY, CONTACT_SUMMARY } from '../../../uri.js'

jest.mock('../../../routes/page-route.js')

const getMockPermission = price => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: 'trout-and-coarse',
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
      })
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
  })
})
