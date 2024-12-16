import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { getData } from '../route'
import { LICENCE_TO_START } from '../../../../uri.js'
import { startDateValidator, getDateErrorFlags } from '../../../../schema/validators/validators.js'

jest.mock('../../../../routes/next-page.js')
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../schema/validators/validators.js')
jest.mock('../../../../uri.js', () => ({
  ...jest.requireActual('../../../../uri.js'),
  LICENCE_TO_START: {
    page: Symbol('licence-to-start-page'),
    uri: Symbol('/licence-to-start')
  }
}))
jest.mock('../../../../schema/validators/validators.js')

describe('licence-to-start > route', () => {
  const getMockRequest = (isLicenceForYou = true, pageGet = () => {}) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => ({
            isLicenceForYou
          })
        },
        page: {
          getCurrentPermission: pageGet
        }
      }
    })
  })

  describe('getData', () => {
    beforeEach(() => {
      getDateErrorFlags.mockClear()
    })

    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const request = getMockRequest()
      const result = await getData(request)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const request = getMockRequest(false)
      const result = await getData(request)
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it.each([
      ['full-date', 'object.missing'],
      ['day', 'any.required']
    ])('should add error details ({%s: %s}) to the page data', async (errorKey, errorValue) => {
      const pageGet = async () => ({
        error: { [errorKey]: errorValue }
      })

      const result = await getData(getMockRequest(undefined, pageGet))
      expect(result.error).toEqual({ errorKey, errorValue })
    })

    it('omits error if there is no error', async () => {
      const result = await getData(getMockRequest())
      expect(result.error).toBeUndefined()
    })

    it('passes correct page name when getting page cache', async () => {
      const pageGet = jest.fn(() => {})
      await getData(getMockRequest(undefined, pageGet))
      expect(pageGet).toHaveBeenCalledWith(LICENCE_TO_START.page)
    })

    it('adds return value of getErrorFlags to the page data', async () => {
      const errorFlags = { unique: Symbol('error-flags') }
      getDateErrorFlags.mockReturnValueOnce(errorFlags)
      const result = await getData(getMockRequest())
      expect(result).toEqual(expect.objectContaining(errorFlags))
    })

    it('passes error to getErrorFlags', async () => {
      const error = Symbol('error')
      await getData(getMockRequest(undefined, async () => ({ error })))
      expect(getDateErrorFlags).toHaveBeenCalledWith(error)
    })
  })

  describe('default', () => {
    it('should call the pageRoute with date-of-birth, /buy/date-of-birth, dateOfBirthValidator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith(LICENCE_TO_START.page, LICENCE_TO_START.uri, startDateValidator, nextPage, getData)
    })
  })
})
