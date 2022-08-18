import { getFromSummary, getData, checkNavigation } from '../route'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../constants.js'
import {
  DATE_OF_BIRTH,
  DISABILITY_CONCESSION,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_TYPE,
  NAME,
  NEW_TRANSACTION,
  RENEWAL_START_DATE
} from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import '../../find-permit.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'

jest.mock('../../find-permit.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/uri-helper.js')

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
    const mockStatusCacheGet = jest.fn(() => ({}))
    const mockStatusCacheSet = jest.fn()
    const mockTransactionCacheGet = jest.fn()
    const mockTransactionCacheSet = jest.fn()

    const mockRequest = {
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: mockStatusCacheGet,
            setCurrentPermission: mockStatusCacheSet
          },
          transaction: {
            getCurrentPermission: mockTransactionCacheGet,
            setCurrentPermission: mockTransactionCacheSet
          }
        }
      }),
      i18n: {
        getCatalog: () => ({
          licence_type_radio_salmon: 'Salmon and sea trout'
        })
      },
      url: {
        search: ''
      },
      path: '',
      locale: 'en'
    }

    it('should return a summary table with required data for page', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
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
      }))
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
      [RENEWAL_START_DATE.uri],
      [LICENCE_TO_START.uri],
      [NEW_TRANSACTION.uri]
    ])('addLanguageCodeToUri is called with the expected arguments', async uri => {
      const permission = {
        permit: {
          cost: 1
        },
        licensee: {
          birthDate: '1996-01-01'
        },
        isRenewal: true
      }

      mockTransactionCacheGet.mockImplementationOnce(() => permission)

      await getData(mockRequest)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, uri)
    })

    it('should return a redirect error if firstName is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: {} }))
      let error = false
      try {
        await getData(mockRequest)
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(NAME.uri)
    })

    it('should return a redirect error if lastName is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: { firstName: 'John' } }))
      let error = false
      try {
        await getData(mockRequest)
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(NAME.uri)
    })

    it('licenceTypeDisplay is called with the expected arguments', async () => {
      const catalog = Symbol('mock catalog')
      const permission = {
        permit: {
          cost: 1
        },
        licensee: {
          birthDate: '1996-01-01'
        },
        isRenewal: true
      }
      const sampleRequest = {
        ...mockRequest,
        i18n: {
          getCatalog: () => catalog
        }
      }

      mockTransactionCacheGet.mockImplementationOnce(() => permission)

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
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
      }))
      const mockTypeDisplayValue = Symbol('type display return value')
      const mockStartTimeValue = Symbol('start time return value')
      licenceTypeDisplay.mockReturnValueOnce(mockTypeDisplayValue)
      displayStartTime.mockReturnValueOnce(mockStartTimeValue)
      const result = await getData(mockRequest)
      const ret = result.licenceTypeStr
      expect(ret).toEqual(mockTypeDisplayValue)
    })
  })

  describe('checkNavigation', () => {
    it('should throw a GetDataRedirect if no licensee first name or last name is found', () => {
      const permission = { licensee: { firstName: undefined, lastName: undefined } }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if no date of birth is found', () => {
      const permission = {
        licensee: {
          firstName: 'Barry',
          lastName: 'Scott',
          birthDate: undefined
        }
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if no licence start date is found', () => {
      const permission = {
        licensee: {
          firstName: 'Barry',
          lastName: 'Scott',
          birthDate: '1946-01-01'
        },
        licenceStartDate: undefined
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if no number of rods or licence type is found', () => {
      const permission = {
        licensee: {
          firstName: 'Barry',
          lastName: 'Scott',
          birthDate: '1946-01-01'
        },
        licenceStartDate: '2021-07-01',
        numberOfRods: undefined,
        licenceType: undefined
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should throw a GetDataRedirect if no licence length is found', () => {
      const permission = {
        licensee: {
          firstName: 'Barry',
          lastName: 'Scott',
          birthDate: '1946-01-01'
        },
        licenceStartDate: '2021-07-01',
        numberOfRods: '3',
        licenceType: 'Salmon and sea trout',
        licenceLength: undefined
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })
  })
})
