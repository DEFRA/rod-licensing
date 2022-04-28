import { getFromSummary, getData, setMultibuyValues } from '../route'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../constants.js'
import { DATE_OF_BIRTH, LICENCE_LENGTH, LICENCE_TO_START, LICENCE_TYPE, NAME } from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'
import '../../find-permit.js'

jest.mock('../../find-permit.js')

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

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

    const generateRequestMock = (transaction = {}) => ({
      cache: jest.fn(() => ({
        helpers: {
          transaction: {
            get: jest.fn(() => transaction),
            set: jest.fn()
          }
        }
      }))
    })

    const mockRequest = (transaction = {}) => ({
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: mockStatusCacheGet,
            setCurrentPermission: mockStatusCacheSet
          },
          transaction: {
            get: jest.fn(() => transaction),
            getCurrentPermission: mockTransactionCacheGet,
            setCurrentPermission: mockTransactionCacheSet
          }
        }
      })
    })

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
      const transaction = {
        permissions: {
          length: 0,
          isLicenceForYou: true
        }
      }
      generateRequestMock(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.name).toBe(NAME.uri)
    })

    it('should return a redirect error if firstName is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: {} }))
      const transaction = {
        permissions: {
          length: 0,
          isLicenceForYou: false
        }
      }
      let error = false
      try {
        await getData(mockRequest(transaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(NAME.uri)
    })

    it('should return a redirect error if lastName is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: { firstName: 'John' } }))
      const transaction = {
        permissions: {
          length: 0,
          isLicenceForYou: false
        }
      }
      let error = false
      try {
        await getData(mockRequest(transaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(NAME.uri)
    })

    it('should return a redirect error if date of birth is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: { firstName: 'John', lastName: 'Smith' } }))
      const transaction = {
        permissions: {
          length: 0,
          isLicenceForYou: false
        }
      }
      let error = false
      try {
        await getData(mockRequest(transaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(DATE_OF_BIRTH.uri)
    })

    it('should return a redirect error if start date is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' }
      }))
      const transaction = {
        permissions: {
          length: 0,
          isLicenceForYou: false
        }
      }
      let error = false
      try {
        await getData(mockRequest(transaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(LICENCE_TO_START.uri)
    })

    it('should return a redirect error if number of rods is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        licenceType: 'Salmon and sea trout'
      }))
      const transaction = {
        permissions: {
          isLicenceForYou: false
        }
      }
      let error = false
      try {
        await getData(mockRequest(transaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(LICENCE_TYPE.uri)
    })

    it('should return a redirect error if licence type is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        numberOfRods: '3'
      }))
      const transaction = {
        permissions: {
          isLicenceForYou: false
        }
      }
      let error = false
      try {
        await getData(mockRequest(transaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(LICENCE_TYPE.uri)
    })

    it('should return a redirect error if licence length is not included on the licensee', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        numberOfRods: '3',
        licenceType: 'Salmon and sea trout'
      }))
      const transaction = {
        permissions: {
          isLicenceForYou: false
        }
      }
      let error = false
      try {
        await getData(mockRequest(transaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(LICENCE_LENGTH.uri)
    })

    it('multibuy - should return the name page uri', async () => {
      isMultibuyForYou.mockImplementationOnce(() => true)
      const permission = [
        {
          licensee: {
            firstName: 'Graham',
            lastName: 'Willis',
            birthDate: '1996-01-01',
            isLicenceForYou: true
          }
        },
        {
          licensee: {
            firstName: undefined,
            lastName: undefined,
            birthDate: undefined,
            isLicenceForYou: true
          }
        }
      ]
      const transaction = {
        permissions: {
          filter: jest.fn(() => permission)
        }
      }
      generateRequestMock(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.name).toBe(NAME.uri)
    })
  })

  describe('Multibuy', () => {
    it('should update the multibuy name and birth details based on if multibuy and licence for you', () => {
      const permission = [
        {
          licensee: {
            firstName: 'Graham',
            lastName: 'Willis',
            birthDate: '1996-01-01',
            isLicenceForYou: true
          }
        },
        {
          licensee: {
            firstName: undefined,
            lastName: undefined,
            birthDate: undefined,
            isLicenceForYou: true
          }
        }
      ]
      const transaction = {
        permissions: {
          filter: jest.fn(() => permission)
        }
      }
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = setMultibuyValues(transaction)
      expect(result).toEqual(permission[0].licensee)
    })
  })
})
