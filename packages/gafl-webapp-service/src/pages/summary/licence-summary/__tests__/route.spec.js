import { getFromSummary, getData, checkNavigation } from '../route'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../constants.js'
import { DATE_OF_BIRTH, LICENCE_LENGTH, LICENCE_TO_START, LICENCE_TYPE, NAME } from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))
jest.mock('../../find-permit.js')

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

    const mockRequest = (transaction = {}) => ({
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: mockStatusCacheGet,
            setCurrentPermission: mockStatusCacheSet
          },
          transaction: {
            get: jest.fn(() => transaction),
            set: jest.fn(),
            getCurrentPermission: mockTransactionCacheGet,
            setCurrentPermission: mockTransactionCacheSet
          }
        }
      })
    })

    it('should return the name page uri', async () => {
      const transaction = {
        permissions: [
          {
            licensee: {
              firstName: 'Graham',
              lastName: 'Willis',
              birthDate: '1996-01-01'
            },
            isLicenceForYou: true
          },
          {
            licensee: {
              firstName: undefined,
              lastName: undefined,
              birthDate: undefined
            },
            isLicenceForYou: true
          }
        ]
      }
      mockRequest(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.name).toBe(NAME.uri)
    })

    it('should return a redirect error if firstName is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: {} }))
      let error = false
      try {
        await getData(mockRequest(mockTransaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(NAME.uri)
    })

    it('should return a redirect error if lastName is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: { firstName: 'John' } }))
      let error = false
      try {
        await getData(mockRequest(mockTransaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(NAME.uri)
    })

    it('should return a redirect error if date of birth is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: { firstName: 'John', lastName: 'Smith' } }))
      let error = false
      try {
        await getData(mockRequest(mockTransaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(DATE_OF_BIRTH.uri)
    })

    it('should return a redirect error if start date is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: null
      }))
      let error = false
      try {
        await getData(mockRequest(mockTransaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(LICENCE_TO_START.uri)
    })

    it('should return a redirect error if number of rods is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        licenceType: 'Salmon and sea trout'
      }))
      let error = false
      try {
        await getData(mockRequest(mockTransaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(LICENCE_TYPE.uri)
    })

    it('should return a redirect error if licence type is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        numberOfRods: '3'
      }))
      let error = false
      try {
        await getData(mockRequest(mockTransaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(LICENCE_TYPE.uri)
    })

    it('should return a redirect error if licence length is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        numberOfRods: '3',
        licenceType: 'Salmon and sea trout'
      }))
      let error = false
      try {
        await getData(mockRequest(mockTransaction))
      } catch (e) {
        error = e
      }
      expect(error).not.toBeFalsy()
      expect(error).toBeInstanceOf(GetDataRedirect)
      expect(error.redirectUrl).toBe(LICENCE_LENGTH.uri)
    })

    it('multibuy - should return the name page uri', async () => {
      isMultibuyForYou.mockImplementationOnce(() => true)
      const transaction = {
        permissions: [
          {
            licensee: {
              firstName: 'Graham',
              lastName: 'Willis',
              birthDate: '1996-01-01'
            },
            isLicenceForYou: true
          },
          {
            licensee: {
              firstName: undefined,
              lastName: undefined,
              birthDate: undefined
            },
            isLicenceForYou: true
          }
        ]
      }
      mockRequest(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.name).toBe(NAME.uri)
    })
  })

  describe('CheckNavigation', () => {
    it('should return a redirect error if firstName is not included on the licensee', async () => {
      const permission = { licensee: { firstName: null } }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should return a redirect error if lastName is not included on the licensee', async () => {
      const permission = { licensee: { firstName: 'Scott', lastName: null } }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should return a redirect error if date of birth is not included on the licensee', async () => {
      const permission = { licensee: { firstName: 'Scott', lastName: 'Michael', birthDate: null } }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should return a redirect error if start date is not included on the licensee', async () => {
      const permission = {
        licensee: { firstName: 'Scott', lastName: 'Michael', birthDate: '1996-01-01' },
        licenceStartDate: null
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should return a redirect error if number of rods is not included on the licensee', async () => {
      const permission = {
        licensee: { firstName: 'Scott', lastName: 'Michael', birthDate: '1996-01-01' },
        licenceStartDate: '2022-07-01',
        numberOfRods: null
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should return a redirect error if licence type is not included on the licensee', async () => {
      const permission = {
        licensee: { firstName: 'Scott', lastName: 'Michael', birthDate: '1996-01-01' },
        licenceStartDate: '2022-07-01',
        numberOfRods: 3,
        licenceType: null
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })

    it('should return a redirect error if licence length is not included on the licensee', async () => {
      const permission = {
        licensee: { firstName: 'Scott', lastName: 'Michael', birthDate: '1996-01-01' },
        licenceStartDate: '2022-07-01',
        numberOfRods: 3,
        licenceType: 'Salmon and sea trout',
        licenceLength: null
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })
  })
})
