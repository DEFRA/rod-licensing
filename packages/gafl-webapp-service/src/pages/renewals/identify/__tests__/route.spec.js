import pageRoute from '../../../../routes/page-route.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData, validator } from '../route.js'
import { IDENTIFY, NEW_TRANSACTION } from '../../../../uri.js'
import { dateOfBirthValidator, getDateErrorFlags } from '../../../../schema/validators/validators.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { validation } from '@defra-fish/business-rules-lib'

jest.mock('../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../uri.js', () => ({
  IDENTIFY: { page: 'identify page', uri: 'identify uri' },
  AUTHENTICATE: { uri: Symbol('authenticate uri') },
  NEW_TRANSACTION: { uri: Symbol('new transaction uri') }
}))
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../schema/validators/validators.js')

describe('getData', () => {
  const getMockRequest = (referenceNumber, pageGet = async () => ({})) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: () => ({
            referenceNumber: referenceNumber
          })
        },
        page: {
          getCurrentPermission: pageGet
        }
      }
    }),
    i18n: {
      getCatalog: () => ({
        dob_error: 'mock dob_error',
        dob_error_missing_day_and_month: 'mock dob_error_missing_day_and_month',
        dob_error_missing_day_and_year: 'mock dob_error_missing_day_and_year',
        dob_error_missing_month_and_year: 'mock dob_error_missing_month_and_year',
        dob_error_missing_day: 'mock dob_error_missing_day',
        dob_error_missing_month: 'mock dob_error_missing_month',
        dob_error_missing_year: 'mock dob_error_missing_year',
        dob_error_non_numeric: 'mock dob_error_non_numeric',
        dob_error_date_real: 'mock dob_error_date_real',
        dob_error_year_min: 'mock dob_error_year_min',
        dob_error_year_max: 'mock dob_error_year_max'
      })
    }
  })

  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    const request = getMockRequest('013AH6')
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, NEW_TRANSACTION.uri)
  })

  it('getData returns correct URI', async () => {
    const expectedUri = Symbol('decorated uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

    const result = await getData(getMockRequest('013AH6'))
    expect(result.uri.new).toEqual(expectedUri)
  })

  it.each([['09F6VF'], ['013AH6'], ['LK563F']])('getData returns referenceNumber', async referenceNumber => {
    const result = await getData(getMockRequest(referenceNumber))
    expect(result.referenceNumber).toEqual(referenceNumber)
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

  it('passes correct page name when getting page cache', async () => {
    const pageGet = jest.fn(() => ({}))
    await getData(getMockRequest(undefined, pageGet))
    expect(pageGet).toHaveBeenCalledWith(IDENTIFY.page)
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

  describe('permission number validation', () => {
    const referenceNumber = 'ABC123'
    const setCurrentPermission = jest.fn()

    const getRequestWithSetCurrentPermission = () => {
      const baseRequest = getMockRequest(referenceNumber)
      return {
        ...baseRequest,
        cache: () => {
          const cache = baseRequest.cache()
          return {
            helpers: {
              ...cache.helpers,
              status: {
                ...cache.helpers.status,
                setCurrentPermission
              }
            }
          }
        }
      }
    }

    beforeEach(() => {
      setCurrentPermission.mockReset()
    })

    it('throws a redirect when validation fails', async () => {
      jest
        .spyOn(validation.permission, 'permissionNumberUniqueComponentValidator')
        .mockReturnValueOnce({ validate: () => ({ error: new Error('invalid') }) })

      await expect(getData(getRequestWithSetCurrentPermission())).rejects.toBeInstanceOf(GetDataRedirect)
    })

    it('clears the cached reference when validation fails', async () => {
      jest
        .spyOn(validation.permission, 'permissionNumberUniqueComponentValidator')
        .mockReturnValueOnce({ validate: () => ({ error: new Error('invalid') }) })

      try {
        await getData(getRequestWithSetCurrentPermission())
      } catch (error) {
        if (!(error instanceof GetDataRedirect)) {
          throw error
        }
      }

      expect(setCurrentPermission).toHaveBeenCalledWith({ referenceNumber: null })
    })

    it('returns the reference number when validation passes', async () => {
      jest
        .spyOn(validation.permission, 'permissionNumberUniqueComponentValidator')
        .mockReturnValueOnce({ validate: () => ({ value: referenceNumber }) })

      const result = await getData(getRequestWithSetCurrentPermission())

      expect(result.referenceNumber).toBe(referenceNumber)
    })

    it('does not mutate the cached reference when validation passes', async () => {
      jest
        .spyOn(validation.permission, 'permissionNumberUniqueComponentValidator')
        .mockReturnValueOnce({ validate: () => ({ value: referenceNumber }) })

      await getData(getRequestWithSetCurrentPermission())

      expect(setCurrentPermission).not.toHaveBeenCalled()
    })
  })
})

describe('default', () => {
  it('should call the pageRoute with date-of-birth, /buy/date-of-birth, dateOfBirthValidator and nextPage', async () => {
    expect(pageRoute).toBeCalledWith(IDENTIFY.page, IDENTIFY.uri, validator, expect.any(Function), getData)
  })
})

describe('page route next', () => {
  const nextPage = pageRoute.mock.calls[0][3]
  beforeEach(jest.clearAllMocks)

  it('passes a function as the nextPage argument', () => {
    expect(typeof nextPage).toBe('function')
  })

  it('calls addLanguageCodeToUri', () => {
    nextPage()
    expect(addLanguageCodeToUri).toHaveBeenCalled()
  })

  it('passes request to addLanguageCodeToUri', () => {
    const request = Symbol('request')
    nextPage(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, expect.anything())
  })

  it('next page returns result of addLanguageCodeToUri', () => {
    const expectedResult = Symbol('add language code to uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedResult)
    expect(nextPage()).toBe(expectedResult)
  })
})

describe('validator', () => {
  const getMockRequest = (postcode = 'AA1 1AA', referenceNumber = 'A1B2C3') => ({
    postcode,
    referenceNumber
  })

  it('fails if dateOfBirth validator fails', () => {
    const expectedError = new Error('expected error')
    dateOfBirthValidator.mockImplementationOnce(() => {
      throw expectedError
    })
    expect(() => validator(getMockRequest)).toThrow(expectedError)
  })

  it('passes if dateOfBirth validator passes', () => {
    expect(() => validator(getMockRequest())).not.toThrow()
  })

  it('passes payload to dateOfBirth validator', () => {
    const payload = getMockRequest()
    validator(payload)
    expect(dateOfBirthValidator).toHaveBeenCalledWith(payload)
  })
})
