import { getFromLicenceOptions, getData, checkNavigation } from '../route'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { CHANGE_LICENCE_OPTIONS_SEEN } from '../../../../constants.js'
import { DATE_OF_BIRTH, LICENCE_LENGTH, LICENCE_TO_START, LICENCE_TYPE, NAME, RENEWAL_START_DATE } from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'

jest.mock('../../../summary/find-permit.js')

describe('change-licence-options > route', () => {
  beforeEach(jest.clearAllMocks)

  describe('getFromLicenceOptions', () => {
    it('should return change-licence-options seen, if fromLicenceOptions has been seen', async () => {
      const request = { fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN }
      const result = await getFromLicenceOptions(request)
      expect(result).toBe(CHANGE_LICENCE_OPTIONS_SEEN.SEEN)
    })

    it('should return change-licence-options as false if fromLicenceOptions has not been seen', async () => {
      const request = { getFromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN }
      const result = await getFromLicenceOptions(request)
      expect(result).toBeFalsy()
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

    it.each([
      [getMockedTransaction1(), getMockedStatus1()],
      [getMockedTransaction2(), getMockedStatus2()]
    ])('test output of getData', async (mockTransaction, mockStatus) => {
      const request = {
        cache: () => ({
          helpers: {
            status: { getCurrentPermission: () => mockStatus },
            transaction: { getCurrentPermission: () => mockTransaction }
          }
        })
      }
      expect(await getData(request)).toMatchSnapshot()
    })

    it('should return the name page uri', async () => {
      const transaction = {
        permissions: [
          {
            licensee: {
              firstName: 'Graham',
              lastName: 'Willis',
              birthDate: '1996-01-01'
            }
          },
          {
            licensee: {
              firstName: undefined,
              lastName: undefined,
              birthDate: undefined
            }
          }
        ]
      }
      mockRequest(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.name).toBe(NAME.uri)
    })

    it('should return a redirect error if firstName is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: {} }))
      const getDataRedirectError = new GetDataRedirect(NAME.uri)
      await expect(getData(mockRequest(mockTransaction))).rejects.toThrow(getDataRedirectError)
    })

    it('should return a redirect error if lastName is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: { firstName: 'John' } }))
      const getDataRedirectError = new GetDataRedirect(NAME.uri)
      await expect(getData(mockRequest(mockTransaction))).rejects.toThrow(getDataRedirectError)
    })

    it('should return a redirect error if date of birth is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({ licensee: { firstName: 'John', lastName: 'Smith' } }))
      const getDataRedirectError = new GetDataRedirect(DATE_OF_BIRTH.uri)
      await expect(getData(mockRequest(mockTransaction))).rejects.toThrow(getDataRedirectError)
    })

    it('should return a redirect error if start date is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: null
      }))
      const getDataRedirectError = new GetDataRedirect(LICENCE_TO_START.uri)
      await expect(getData(mockRequest(mockTransaction))).rejects.toThrow(getDataRedirectError)
    })

    it('should return a redirect error if number of rods is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        licenceType: 'Salmon and sea trout'
      }))
      const getDataRedirectError = new GetDataRedirect(LICENCE_TYPE.uri)
      await expect(getData(mockRequest(mockTransaction))).rejects.toThrow(getDataRedirectError)
    })

    it('should return a redirect error if licence type is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        numberOfRods: '3'
      }))
      const getDataRedirectError = new GetDataRedirect(LICENCE_TYPE.uri)
      await expect(getData(mockRequest(mockTransaction))).rejects.toThrow(getDataRedirectError)
    })

    it('should return a redirect error if licence length is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        numberOfRods: '3',
        licenceType: 'Salmon and sea trout'
      }))
      const getDataRedirectError = new GetDataRedirect(LICENCE_LENGTH.uri)
      await expect(getData(mockRequest(mockTransaction))).rejects.toThrow(getDataRedirectError)
    })

    it('multibuy - should return the name page uri', async () => {
      const transaction = {
        permissions: [
          {
            licensee: {
              firstName: 'Graham',
              lastName: 'Willis',
              birthDate: '1996-01-01'
            }
          },
          {
            licensee: {
              firstName: undefined,
              lastName: undefined,
              birthDate: undefined
            }
          }
        ]
      }
      mockRequest(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.name).toBe(NAME.uri)
    })

    // CHECK W PHIL
    it.each([
      [getMockedPermission1(), getMockedStatus1()],
      [getMockedPermission2(), getMockedStatus2()]
    ])('test output of getData', async (mockTransaction, mockStatus) => {
      const request = {
        cache: () => ({
          helpers: {
            status: { getCurrentPermission: () => mockStatus },
            transaction: { getCurrentPermission: () => mockTransaction }
          }
        })
      }
      expect(await getData(request)).toMatchSnapshot()
    })

    // CHECK W PHIL
    it.each([
      ['salmon-and-sea-trout', '3', 'Salmon and sea trout'],
      ['trout-and-coarse', '2', 'Trout and coarse, up to 2 rods'],
      ['trout-and-coarse', '3', 'Trout and coarse, up to 3 rods']
    ])('should return licenceTypeStr as the same value as licenceTypeDisplay', async (type, numOfRods) => {
      const transaction = {
        permissions: {
          concessions: null,
          licenceType: type,
          numberOfRods: numOfRods
        }
      }
      const result = await getData(mockRequest(transaction))
      const expectedResult = licenceTypeDisplay(transaction)
      expect(result.licenceTypeStr).toBe(expectedResult)
    })

    // CHECK W PHIL
    it.each([
      ['Junior', 'salmon-and-sea-trout', '3', 'Salmon and sea trout'],
      ['Junior', 'trout-and-coarse', '2', 'Trout and coarse, up to 2 rods'],
      ['Junior', 'trout-and-coarse', '3', 'Trout and coarse, up to 3 rods'],
      ['Senior', 'salmon-and-sea-trout', '3', 'Salmon and sea trout'],
      ['Senior', 'trout-and-coarse', '2', 'Trout and coarse, up to 2 rods'],
      ['Senior', 'trout-and-coarse', '3', 'Trout and coarse, up to 3 rods']
    ])('should return same result as concessionHelper, if licenceType includes concession hasJunior or hasSenior', async (concession, type, numOfRods) => {
      const transaction = {
        permissions: {
          concessions: concession,
          licenceType: type,
          numberOfRods: numOfRods
        }
      }
      const result = await getData(mockRequest(transaction))
      const expectedResult = licenceTypeDisplay(transaction)
      expect(result.licenceTypeStr).toBe(expectedResult)
    })

    // CHECK W PHIL
    it('should return isContinuing as true if both renewedEndDate is equal to licenceStartDate', async () => {

    })

    // CHECK W PHIL
    it('should return isContinuing as false if both renewedEndDate is not equal to licenceStartDate', async () => {

    })

    // CHECK W PHIL
    it('should return RENEWAL_START_DATE uri if renewal is true', async () => {
      const status = {
        renewal: true
      }
      const transaction = {
        permissions: {
          licenceStartDate: status.renewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri
        }
      }
      mockRequest(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.licenceStartDate).toBe(RENEWAL_START_DATE.uri)
    })

    // CHECK W PHIL
    it('should return LICENCE_TO_START uri if renewal is false', async () => {
      const status = {
        renewal: false
      }
      const transaction = {
        permissions: {
          licenceStartDate: status.renewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri
        }
      }
      mockRequest(transaction)
      const result = await getData(mockRequest(transaction))
      expect(result.uri.licenceStartDate).toBe(LICENCE_TO_START.uri)
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

const getMockRequest = (transaction = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        
      },
      transaction: {
        
      }
    }
  })
})
