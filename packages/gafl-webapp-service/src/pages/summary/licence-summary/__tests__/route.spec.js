import { getFromSummary, getData } from '../route'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../constants.js'
import {
  DATE_OF_BIRTH,
  DISABILITY_CONCESSION,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEW_TRANSACTION
} from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import '../../find-permit.js'
import { licenceTypeDisplay, getErrorPage } from '../../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'
import moment from 'moment-timezone'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))
jest.mock('../../find-permit.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../processors/date-and-time-display.js', () => ({
  displayStartTime: jest.fn(),
  cacheDateFormat: 'YYYY-MM-DD'
}))

jest.mock('moment-timezone', () =>
  jest.fn(() => ({
    tz: () => ({ isAfter: () => {} }),
    isAfter: () => false,
    locale: () => ({ format: () => '1st January 1946' })
  }))
)

jest.mock('../../../../processors/mapping-constants.js', () => ({
  CONCESSION: {
    SENIOR: 'Senior person',
    JUNIOR: 'Junior person',
    DISABLED: 'Disabled person'
  },
  LICENCE_TYPE: {
    'trout-and-coarse': 'Trout and coarse',
    'salmon-and-sea-trout': 'Salmon and sea trout'
  },
  CONCESSION_PROOF: {
    NI: 'NIN',
    blueBadge: 'BB',
    none: 'Not Proof'
  }
}))

describe('licence-summary > route', () => {
  beforeEach(jest.clearAllMocks)

  describe('getFromSummary', () => {
    it('should return licence-summary, if it is a renewal', async () => {
      const result = await getFromSummary(undefined, true)
      expect(result).toBe(LICENCE_SUMMARY_SEEN)
    })

    it('should return licence-summary, if fromSummary has not been set and it is not a renewal', async () => {
      const result = await getFromSummary()
      expect(result).toBe(LICENCE_SUMMARY_SEEN)
    })

    it('should set fromSummary to contact-summary, if fromSummary is contact-summary and it is not a renewal', async () => {
      const result = await getFromSummary(CONTACT_SUMMARY_SEEN)
      expect(result).toBe(CONTACT_SUMMARY_SEEN, false)
    })
  })

  describe('getData', () => {
    beforeEach(getErrorPage.mockReset)

    it('should return the name page uri', async () => {
      const expectedUri = Symbol('name page uri')
      addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

      const {
        uri: { name }
      } = await getData(getSampleRequest())

      expect(name).toEqual(expectedUri)
    })

    it('should return a summary table with required data for page', async () => {
      const mockRequest = getSampleRequest({
        getCurrentTransactionPermission: () => ({
          birthDateStr: '1st January 1946',
          concessionProofs: {
            NI: 'National Insurance Number',
            blueBadge: 'Blue Badge',
            none: 'No Proof'
          },
          cost: 6,
          disabled: true,
          hasExpired: false,
          hasJunior: false,
          isContinuing: false,
          isRenewal: true,
          licenceLength: '12M',
          licenceStartDate: '2021-07-01',
          licenceType: 'Salmon and sea trout',
          licenceTypeStr: 'Salmon and sea trout',
          licensee: {
            birthDate: '1946-01-01',
            firstName: 'Graham',
            lastName: 'Willis'
          },
          numberOfRods: '3',
          permit: {
            cost: 6
          },
          startAfterPaymentMinute: 30,
          startTimeString: '0.00am (first minute of the day) on 1 July 2021',
          uri: {
            clear: '/buy/new',
            dateOfBirth: '/buy/date-of-birth',
            disabilityConcession: '/buy/disability-concession',
            licenceLength: '/buy/licence-length',
            licenceStartDate: '/buy/start-kind',
            licenceToStart: '/buy/start-kind',
            licenceType: '/buy/licence-type',
            name: '/buy/name'
          }
        })
      })
      const result = await getData(mockRequest)
      expect(result).toMatchSnapshot()
    })

    it.each([
      [NAME.uri],
      [LICENCE_LENGTH.uri],
      [LICENCE_TYPE.uri],
      [LICENCE_TO_START.uri],
      [DATE_OF_BIRTH.uri],
      [DISABILITY_CONCESSION.uri],
      [LICENCE_TO_START.uri],
      [NEW_TRANSACTION.uri]
    ])('addLanguageCodeToUri is called with the expected arguments', async uri => {
      const mockedRequest = getSampleRequest()

      await getData(mockedRequest)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockedRequest, uri)
    })

    it('multibuy - should return the name page uri', async () => {
      isMultibuyForYou.mockImplementationOnce(() => true)
      const expectedUri = Symbol('return value')
      addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

      const {
        uri: { name }
      } = await getData(getSampleRequest())

      expect(name).toEqual(expectedUri)
    })

    it('licenceTypeDisplay is called with the expected arguments', async () => {
      const catalog = Symbol('mock catalog')
      const permission = getSamplePermission()
      const sampleRequest = getSampleRequest({
        getTransaction: () => ({ permissions: [permission] }),
        getCatalog: () => catalog
      })

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const expectedLicenceType = Symbol('expected licence type')
      licenceTypeDisplay.mockReturnValueOnce(expectedLicenceType)

      const result = await getData(getSampleRequest())

      expect(result.licenceTypeStr).toEqual(expectedLicenceType)
    })

    it("throws a GetDataRedirect if getErrorPage returns a value and it isn't a renewal", async () => {
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: false })
      })
      getErrorPage.mockReturnValueOnce('error page')

      const testFunction = () => getData(request)

      await expect(testFunction).rejects.toThrow(GetDataRedirect)
    })

    it("doesn't throw a GetDataRedirect if getErrorPage returns an empty string", async () => {
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: false })
      })
      getErrorPage.mockReturnValueOnce('')
      const getDataResult = async () => {
        try {
          await getData(request)
        } catch (e) {
          return e
        }
      }

      const result = await getDataResult()

      await expect(result).toBeUndefined()
    })

    it("doesn't throw a GetDataRedirect if getErrorPage returns a value but it's a renewal", async () => {
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: true })
      })
      getErrorPage.mockReturnValueOnce('error page')
      const getDataResult = async () => {
        try {
          await getData(request)
        } catch (e) {
          return e
        }
      }

      const result = await getDataResult()

      await expect(result instanceof GetDataRedirect).toBeFalsy()
    })

    it('passes return value of getErrorPage to thrown GetDataRedirect', async () => {
      const expectedRedirectUrl = Symbol('error page')
      getErrorPage.mockReturnValueOnce(expectedRedirectUrl)
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: false })
      })
      const runGetData = async () => {
        try {
          await getData(request)
        } catch (e) {
          return e
        }
      }
      const thrownError = await runGetData()
      expect(thrownError.redirectUrl).toEqual(expectedRedirectUrl)
    })

    it('passes permission to getErrorPage', async () => {
      const permission = getSamplePermission({ isRenewal: false })
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => permission
      })
      const runGetData = async () => {
        try {
          await getData(request)
        } catch (e) {
          return e
        }
      }

      await runGetData()

      expect(getErrorPage).toHaveBeenCalledWith(permission)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const mockRequest = getSampleRequest({
        getCurrentTransactionPermission: () => ({
          licenceStartDate: '2021-07-01',
          numberOfRods: '3',
          licenceType: 'Salmon and sea trout',
          licenceLength: '12M',
          licensee: {
            firstName: 'Graham',
            lastName: 'Willis',
            birthDate: '1946-01-01'
          },
          permit: {
            cost: 6
          }
        })
      })
      const mockTypeDisplayValue = Symbol('type display return value')
      const mockStartTimeValue = Symbol('start time return value')
      licenceTypeDisplay.mockReturnValueOnce(mockTypeDisplayValue)
      displayStartTime.mockReturnValueOnce(mockStartTimeValue)
      const result = await getData(mockRequest)
      const ret = result.licenceTypeStr
      expect(ret).toEqual(mockTypeDisplayValue)
    })

    it('birthDateStr should return locale-specific date string', async () => {
      const expectedLocale = Symbol('expected locale')
      const mockRequest = getSampleRequest({
        getCurrentTransactionPermission: () => ({
          isRenewal: true,
          permit: { cost: 1 },
          licensee: {
            birthDate: '1970-01-01'
          }
        })
      })
      const locale = jest.fn(() => ({ format: () => 'locale-aware birth date' }))
      moment.mockImplementation(() => ({
        tz: () => ({ isAfter: () => {} }),
        isAfter: jest.fn(),
        locale
      }))
      mockRequest.locale = expectedLocale

      await getData(mockRequest)

      expect(locale).toHaveBeenCalledWith(expectedLocale)

      moment.mockReset()
    })
  })

  describe('checkNavigation', () => {
    function toThrowRedirectTo (error, uri) {
      if (error instanceof GetDataRedirect) {
        if (error.redirectUrl === uri) {
          return {
            message: () =>
              `expected ${this.utils.printReceived(error)} to be a GetDataRedirect error with redirectUrl of ${this.utils.printExpected(
                uri
              )}`,
            pass: true
          }
        }
        return {
          message: () =>
            `expected ${this.utils.printReceived(error)} to to have redirectUrl of ${this.utils.printExpected(
              uri
            )} and in fact it has ${this.utils.printReceived(error.redirectUrl)}`,
          pass: false
        }
      }
      return {
        message: () => `expected ${this.utils.printReceived(error)} to be of type GetDataRedirect`,
        pass: false
      }
    }
    expect.extend({
      toThrowRedirectTo
    })

    it('should throw a GetDataRedirect if no licensee first name or last name is found', async () => {
      const mockRequest = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ licensee: { firstName: undefined, lastName: undefined } })
      })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(NAME.uri)
    })

    it('should throw a GetDataRedirect if no date of birth is found', async () => {
      const mockRequest = getSampleRequest({
        getCurrentTransactionPermission: () =>
          getSamplePermission({
            licensee: {
              firstName: 'Barry',
              lastName: 'Scott',
              birthDate: undefined
            }
          })
      })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(DATE_OF_BIRTH.uri)
    })

    it('should throw a GetDataRedirect if no licence start date is found', async () => {
      const mockRequest = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ licenceStartDate: undefined })
      })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(LICENCE_TO_START.uri)
    })

    it('should throw a GetDataRedirect if no number of rods or licence type is found', async () => {
      const mockRequest = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ numberOfRods: undefined, licenceType: undefined })
      })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(LICENCE_TYPE.uri)
    })

    it('should throw a GetDataRedirect if no licence length is found', async () => {
      const mockRequest = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ licenceLength: undefined })
      })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(LICENCE_LENGTH.uri)
    })
  })
})

const getSampleRequest = ({
  getCurrentStatusPermission = () => ({}),
  setCurrentStatusPermission = () => {},
  getCurrentTransactionPermission = () => getSamplePermission(),
  setCurrentTransactionPermission = () => {},
  getTransaction = () => ({ permissions: [getSamplePermission()] }),
  getCatalog = () => ({
    licence_type_radio_salmon: 'Salmon and sea trout'
  })
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: getCurrentStatusPermission,
        setCurrentPermission: setCurrentStatusPermission
      },
      transaction: {
        get: getTransaction,
        set: () => {},
        getCurrentPermission: getCurrentTransactionPermission,
        setCurrentPermission: setCurrentTransactionPermission
      }
    }
  }),
  i18n: {
    getCatalog
  },
  url: {
    search: ''
  },
  path: ''
})

const getSamplePermission = (overrides = {}) => ({
  isLicenceForYou: true,
  licenceStartDate: '2021-07-01',
  numberOfRods: '3',
  licenceType: 'Salmon and sea trout',
  licenceLength: '12M',
  licensee: {
    firstName: 'Brenin',
    lastName: 'Pysgotwr',
    birthDate: '1946-01-01'
  },
  permit: {
    cost: 6
  },
  ...overrides
})
