import { getFromSummary, getData } from '../route'
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
import { displayStartTime } from '../../../../processors/date-and-time-display'

jest.mock('../../find-permit.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/uri-helper.js')

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
    const mockTransactionCacheGet = jest.fn(() => ({
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
      path: ''
    }

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
      const mockTypeDisplayValue = Symbol('type display return value')
      const mockStartTimeValue = Symbol('start time return value')
      licenceTypeDisplay.mockReturnValueOnce(mockTypeDisplayValue)
      displayStartTime.mockReturnValueOnce(mockStartTimeValue)
      const result = await getData(mockRequest)
      const ret = result.licenceTypeStr

      expect(ret).toEqual(mockTypeDisplayValue)
    })
  })
})
