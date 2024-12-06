import pageRoute from '../../../../routes/page-route.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { getData, validator } from '../route.js'
import { IDENTIFY, NEW_TRANSACTION } from '../../../../uri.js'
import { dateOfBirthValidator } from '../../../../schema/validators/validators.js'

jest.mock('../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../uri.js', () => ({
  IDENTIFY: { page: 'identify page', uri: 'identify uri' },
  AUTHENTICATE: { uri: Symbol('authenticate uri') },
  NEW_TRANSACTION: { uri: Symbol('new transaction uri') }
}))
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../schema/validators/validators.js')

describe('getData', () => {
  const getMockRequest = referenceNumber => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: () => ({
            referenceNumber: referenceNumber
          })
        }
      }
    })
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
