import { getData } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { DATE_OF_BIRTH, LICENCE_FOR } from '../../../../uri.js'
import { dateOfBirthValidator, getDateErrorFlags } from '../../../../schema/validators/validators.js'

jest.mock('../../../../routes/next-page.js')
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../schema/validators/validators.js')
jest.mock('../../../../uri.js', () => ({
  ...jest.requireActual('../../../../uri.js'),
  DATE_OF_BIRTH: {
    page: Symbol('date-of-birth-page'),
    uri: Symbol('/date-of-birth')
  },
  LICENCE_TO_START: {
    page: Symbol('licence-to-start-page'),
    uri: Symbol('/licence-to-start')
  }
}))

describe('name > route', () => {
  const mockRequest = ({
    pageGet = async () => {},
    statusGet = async () => ({ [LICENCE_FOR.page]: true }),
    transactionGet = async () => ({ isLicenceForYou: null })
  } = {}) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: transactionGet
        },
        status: {
          getCurrentPermission: statusGet
        },
        page: {
          getCurrentPermission: pageGet
        }
      }
    })
  })

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const transactionGet = async () => ({
        isLicenceForYou: true
      })
      const statusGet = async () => ({
        [LICENCE_FOR.page]: true
      })

      const result = await getData(mockRequest({ statusGet, transactionGet }))
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const transactionGet = async () => ({
        isLicenceForYou: false
      })
      const statusGet = async () => ({
        [LICENCE_FOR.page]: true
      })
      const result = await getData(mockRequest({ statusGet, transactionGet }))
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it.each([
      ['full-date', 'object.missing'],
      ['day', 'any.required']
    ])('should add error details ({%s: %s}) to the page data', async (errorKey, errorValue) => {
      const pageGet = async () => ({
        error: { [errorKey]: errorValue }
      })

      const result = await getData(mockRequest({ pageGet }))
      expect(result.error).toEqual({ errorKey, errorValue })
    })

    it('omits error if there is no error', async () => {
      const result = await getData(mockRequest())
      expect(result.error).toBeUndefined()
    })

    it('adds return value of getErrorFlags to the page data', async () => {
      const errorFlags = { unique: Symbol('error-flags') }
      getDateErrorFlags.mockReturnValueOnce(errorFlags)
      const result = await getData(mockRequest())
      expect(result).toEqual(expect.objectContaining(errorFlags))
    })

    it('passes error to getErrorFlags', async () => {
      const error = Symbol('error')
      await getData(mockRequest({ pageGet: async () => ({ error }) }))
      expect(getDateErrorFlags).toHaveBeenCalledWith(error)
    })

    it('passes correct page name when getting page cache', async () => {
      const pageGet = jest.fn(() => ({}))
      await getData(mockRequest({ pageGet }))
      expect(pageGet).toHaveBeenCalledWith(DATE_OF_BIRTH.page)
    })
  })

  describe('redirectToStartOfJourney', () => {
    it('should throw a redirect if not been to LICENCE_FOR page', async () => {
      const transactionGet = async () => ({
        isLicenceForYou: true
      })
      const statusGet = async () => ({
        [LICENCE_FOR.page]: false
      })
      const func = () => getData(mockRequest({ statusGet, transactionGet }))
      await expect(func).rejects.toThrowRedirectTo(LICENCE_FOR.uri)
    })

    it('should not throw a redirect if not been to LICENCE_FOR page', async () => {
      const transactionGet = async () => ({
        isLicenceForYou: true
      })
      const statusGet = async () => ({
        [LICENCE_FOR.page]: true
      })

      let error

      try {
        await getData(mockRequest({ statusGet, transactionGet }))
      } catch (e) {
        error = e
      }

      expect(error).toBeUndefined()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with date-of-birth, /buy/date-of-birth, dateOfBirthValidator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith(DATE_OF_BIRTH.page, DATE_OF_BIRTH.uri, dateOfBirthValidator, nextPage, getData)
    })
  })
})
