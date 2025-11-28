import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_IDENTIFY } from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import { getData, validator } from '../route.js'
import { dateOfBirthValidator, getDateErrorFlags } from '../../../../../schema/validators/validators.js'
import { validation } from '@defra-fish/business-rules-lib'
import GetDataRedirect from '../../../../../handlers/get-data-redirect.js'

require('../route.js')

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_IDENTIFY: { page: 'cancel-rp identify page', uri: Symbol('cancel-rp identify uri') },
  CANCEL_RP_AUTHENTICATE: { uri: 'cancel-rp-authenticate uri' }
}))
jest.mock('../../../../../processors/uri-helper.js')
jest.mock('../../../../../schema/validators/validators.js')

describe('cancel recurring payment identify route', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('getData', () => {
    const getMockRequest = (referenceNumber, pageGet = async () => ({})) => ({
      cache: () => ({
        helpers: {
          transaction: {
            getCurrentPermission: () => ({
              referenceNumber
            }),
            setCurrentPermission: jest.fn()
          },
          page: {
            getCurrentPermission: pageGet
          }
        }
      }),
      i18n: {
        getCatalog: () => [],
        getLocales: () => []
      }
    })

    it('passes correct page name when getting page cache', async () => {
      const pageGet = jest.fn(() => ({}))
      await getData(getMockRequest(undefined, pageGet))
      expect(pageGet).toHaveBeenCalledWith(CANCEL_RP_IDENTIFY.page)
    })

    it.each([['09F6VF'], ['013AH6'], ['LK563F']])('returns referenceNumber when permission includes %s', async referenceNumber => {
      const result = await getData(getMockRequest(referenceNumber))
      expect(result.referenceNumber).toEqual(referenceNumber)
    })

    it('throws redirect when permission number fails validation', async () => {
      const spy = jest
        .spyOn(validation.permission, 'permissionNumberUniqueComponentValidator')
        .mockReturnValue({ validate: () => ({ error: true }) })
      const request = getMockRequest('BAD123')
      request.cache().helpers.transaction.setCurrentPermission = jest.fn()
      await expect(getData(request)).rejects.toBeInstanceOf(GetDataRedirect)
      spy.mockRestore()
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

    it.each([
      ['full-date', 'object.missing'],
      ['day', 'any.required']
    ])('adds error details (%s: %s) to the page data', async (errorKey, errorValue) => {
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
  })

  describe('pageRoute', () => {
    it('passes CANCEL_RP_IDENTIFY.page as the first argument to pageRoute', () => {
      expect(pageRoute.mock.calls[0][0]).toBe(CANCEL_RP_IDENTIFY.page)
    })

    it('passes CANCEL_RP_IDENTIFY.uri as the second argument to pageRoute', () => {
      expect(pageRoute.mock.calls[0][1]).toBe(CANCEL_RP_IDENTIFY.uri)
    })

    it('calls pageRoute with validator, nextPage function, and getData', () => {
      expect(pageRoute).toBeCalledWith(CANCEL_RP_IDENTIFY.page, CANCEL_RP_IDENTIFY.uri, validator, expect.any(Function), getData)
    })
  })

  describe('page route next', () => {
    const getNextPage = () => pageRoute.mock.calls[0][3]

    it('passes a function', () => {
      const nextPage = getNextPage()
      expect(typeof nextPage).toBe('function')
    })

    it('calls addLanguageCodeToUri', () => {
      const nextPage = getNextPage()
      nextPage()
      expect(addLanguageCodeToUri).toHaveBeenCalled()
    })

    it('passes request to addLanguageCodeToUri', () => {
      const request = Symbol('request')
      const nextPage = getNextPage()
      nextPage(request)
      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, expect.anything())
    })

    it('returns result of addLanguageCodeToUri', () => {
      const expectedResult = Symbol('add language code to uri')
      const nextPage = getNextPage()
      addLanguageCodeToUri.mockReturnValueOnce(expectedResult)
      expect(nextPage()).toBe(expectedResult)
    })
  })

  describe('validator', () => {
    const getMockPayload = (postcode = 'AA1 1AA', referenceNumber = 'A1B2C3') => ({
      postcode,
      referenceNumber
    })

    it('fails if dateOfBirthValidator throws', () => {
      const expectedError = new Error('expected error')
      dateOfBirthValidator.mockImplementationOnce(() => {
        throw expectedError
      })
      expect(() => validator(getMockPayload())).toThrow(expectedError)
    })

    it('passes if dateOfBirthValidator succeeds', () => {
      expect(() => validator(getMockPayload())).not.toThrow()
    })

    it('passes payload to dateOfBirthValidator', () => {
      const p = getMockPayload()
      validator(p)
      expect(dateOfBirthValidator).toHaveBeenCalledWith(p)
    })

    it('fails if permission number is invalid', () => {
      jest.spyOn(validation.permission, 'permissionNumberUniqueComponentValidator').mockReturnValue({ validate: () => ({ error: 'bad' }) })
      expect(() => validator({ referenceNumber: 'BAD', postcode: 'AA1 1AA' })).toThrow()
    })

    it('fails if postcode is invalid', () => {
      jest.spyOn(validation.contact, 'createOverseasPostcodeValidator').mockReturnValue({ validate: () => ({ error: 'bad' }) })
      expect(() => validator({ referenceNumber: 'ABC123', postcode: 'ZZZ' })).toThrow()
    })
  })
})
