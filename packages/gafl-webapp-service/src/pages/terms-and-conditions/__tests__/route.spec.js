import { getData, validator } from '../route'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { LICENCE_SUMMARY, CONTACT_SUMMARY } from '../../../uri.js'

jest.mock('../../../routes/page-route.js')

describe('terms-and-conditions > route', () => {
  describe('default', () => {
    it('should call the pageRoute with terms-and-conditions, /buy/conditions, validator, nextPage and getData', async () => {
      expect(pageRoute).toBeCalledWith('terms-and-conditions', '/buy/conditions', validator, nextPage, getData)
    })
  })

  describe('getData', () => {
    const mockRequest = (statusGet = () => {}, transactionGet = () => {}) => ({
      cache: () => ({
        helpers: {
          transaction: {
            get: transactionGet
          },
          status: {
            getCurrentPermission: statusGet
          }
        }
      })
    })

    beforeEach(() => jest.clearAllMocks())

    it('LICENCE_SUMMARY redirect', async () => {
      const status = () => ({
        [LICENCE_SUMMARY.page]: false
      })
      const func = () => getData(mockRequest(status))
      await expect(func).rejects.toThrowRedirectTo(LICENCE_SUMMARY.uri)
    })

    it('CONTACT_SUMMARY redirect', async () => {
      const status = () => ({
        [LICENCE_SUMMARY.page]: true,
        [CONTACT_SUMMARY.page]: false
      })
      const func = () => getData(mockRequest(status))
      await expect(func).rejects.toThrowRedirectTo(CONTACT_SUMMARY.uri)
    })

    it('payment required returns false if price = 0', async () => {
      const status = () => ({
        [LICENCE_SUMMARY.page]: true,
        [CONTACT_SUMMARY.page]: true
      })
      const transaction = () => ({
        permissions: [
          {
            licensee: {
              firstName: 'Turanga',
              lastName: 'Leela'
            },
            licenceType: 'trout-and-coarse',
            numberOfRods: '2',
            licenceLength: '8D',
            permit: { cost: 0 }
          },
          {
            licensee: {
              firstName: 'Turanga',
              lastName: 'Leela'
            },
            licenceType: 'trout-and-coarse',
            numberOfRods: '2',
            licenceLength: '8D',
            permit: { cost: 0 }
          }
        ]
      })
      const data = await getData(mockRequest(status, transaction))
      expect(data.paymentRequired).toBeFalsy()
    })

    it.each([
      [0, 24],
      [12, 0],
      [1, 14]
    ])('payment required returns true if price is more than 0', async (price, anotherPrice) => {
      const status = () => ({
        [LICENCE_SUMMARY.page]: true,
        [CONTACT_SUMMARY.page]: true
      })
      const transaction = () => ({
        permissions: [
          {
            licensee: {
              firstName: 'Turanga',
              lastName: 'Leela'
            },
            licenceType: 'trout-and-coarse',
            numberOfRods: '2',
            licenceLength: '8D',
            permit: { cost: price }
          },
          {
            licensee: {
              firstName: 'Turanga',
              lastName: 'Leela'
            },
            licenceType: 'trout-and-coarse',
            numberOfRods: '2',
            licenceLength: '8D',
            permit: { cost: anotherPrice }
          }
        ]
      })
      const data = await getData(mockRequest(status, transaction))
      expect(data.paymentRequired).toBeTruthy()
    })
  })
})
