import { getFromSummary, getData } from '../route'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../constants.js'
import { NAME } from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import '../../find-permit.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'

jest.mock('../../find-permit.js')
jest.mock('../../../../processors/licence-type-display.js')

describe('licence-summary > route', () => {
  beforeEach(jest.clearAllMocks)

  describe('getFromSummary', () => {
    it('should return licence-summary, if it is a renewal', async () => {
      const request = { renewal: true }
      const result = await getFromSummary(request)
      expect(result).toBe(LICENCE_SUMMARY_SEEN)
    })

    it('should return licence-summary, if fromSummary has not been set and it is not a renewal', async () => {
      const result = await getFromSummary({})
      expect(result).toBe(LICENCE_SUMMARY_SEEN)
    })

    it('should set fromSummary to contact-summary, if fromSummary is contact-summary and it is not a renewal', async () => {
      const request = { fromSummary: CONTACT_SUMMARY_SEEN }
      const result = await getFromSummary(request)
      expect(result).toBe(CONTACT_SUMMARY_SEEN)
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
      }
    }

    it('should return the name page uri', async () => {
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
      const result = await getData(mockRequest)
      expect(result.uri.name).toBe(NAME.uri)
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

    it.only('licenceTypeDisplay is called with the expected arguments', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true }))
      const catalog = Symbol('mock catalog')
      const permission = Symbol('mock permission')
      const sampleRequest = {
        ...mockRequest,
        i18n: {
          getCatalog: () => (catalog)
        }
      }
      // permission.permit = {
      //   cost: 6
      // }
      // permission.licensee = {
      //   birthDate: '1946-01-01'
      // }

      mockTransactionCacheGet.mockImplementationOnce(() => permission)

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const returnValue = Symbol('return value')
      licenceTypeDisplay.mockReturnValueOnce(returnValue)

      const result = await getData(mockRequest)
      const ret = result.licenceTypeStr

      expect(ret).toEqual(returnValue)
    })
  })
})
