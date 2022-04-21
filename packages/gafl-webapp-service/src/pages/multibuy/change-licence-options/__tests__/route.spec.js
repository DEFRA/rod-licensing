import { getFromLicenceOptions, getData } from '../route'
import { CHANGE_LICENCE_OPTIONS_SEEN } from '../../../../constants.js'
import { NAME } from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import '../../../summary/find-permit.js'

jest.mock('../../../summary/find-permit.js')

describe('change-licence-options > route', () => {
  beforeEach(jest.clearAllMocks)

  describe('getFromLicenceOptions', () => {
    it('should set fromSummary to contact-summary, if fromSummary is contact-summary and it is not a renewal', async () => {
      const request = { fromSummary: CHANGE_LICENCE_OPTIONS_SEEN }
      const result = await getFromLicenceOptions(request)
      expect(result).toBe(CHANGE_LICENCE_OPTIONS_SEEN)
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
      })
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
  })
})
