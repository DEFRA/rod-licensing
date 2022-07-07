import { getData, checkNavigation } from '../route'
import {
  DATE_OF_BIRTH,
  LICENCE_LENGTH,
  LICENCE_TO_START,
  LICENCE_TYPE as LICENCE_TYPE_URI,
  NAME,
  RENEWAL_START_DATE
} from '../../../../uri.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { CONCESSION } from '../../../../processors/mapping-constants.js'

jest.mock('../../../summary/find-permit.js')
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

describe('change-licence-options > route', () => {
  beforeEach(jest.clearAllMocks)

  describe('getData', () => {
    const mockStatusCacheGet = jest.fn(() => ({}))
    const mockStatusCacheSet = jest.fn()
    const mockTransactionCacheGet = jest.fn()
    const mockTransactionCacheSet = jest.fn()

    const mockRequest = () => ({
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: mockStatusCacheGet,
            setCurrentPermission: mockStatusCacheSet
          },
          transaction: {
            get: jest.fn(),
            set: jest.fn(),
            getCurrentPermission: mockTransactionCacheGet,
            setCurrentPermission: mockTransactionCacheSet
          }
        }
      })
    })

    it('test output of getData', async () => {
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
      const result = await getData(mockRequest())
      expect(result).toMatchSnapshot()
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
      const getDataRedirectError = new GetDataRedirect(LICENCE_TYPE_URI.uri)
      await expect(getData(mockRequest(mockTransaction))).rejects.toThrow(getDataRedirectError)
    })

    it('should return a redirect error if licence type is not included on the licensee', async () => {
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceStartDate: '2025-01-01',
        numberOfRods: '3'
      }))
      const getDataRedirectError = new GetDataRedirect(LICENCE_TYPE_URI.uri)
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

    it.each([
      ['Salmon and sea trout', '3', 'Salmon and sea trout'],
      ['Trout and coarse', '2', 'Trout and coarse, up to 2 rods'],
      ['Trout and coarse', '3', 'Trout and coarse, up to 3 rods']
    ])('should return licenceTypeStr as the same value as licenceTypeDisplay', async (type, numOfRods, expectedResult) => {
      const mockStatus = mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licenceStartDate: mockStatus.renewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri,
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        licenceLength: '12M',
        permit: {
          cost: 6
        },
        licenceType: type,
        numberOfRods: numOfRods
      }))
      const result = await getData(mockRequest(mockTransaction))
      expect(result.licenceTypeStr).toBe(expectedResult)
    })

    it.each([
      ['Junior', 'Salmon and sea trout', '3', 'Salmon and sea trout'],
      ['Junior', 'Trout and coarse', '2', 'Trout and coarse, up to 2 rods'],
      ['Junior', 'Trout and coarse', '3', 'Trout and coarse, up to 3 rods'],
      ['Senior', 'Salmon and sea trout', '3', 'Salmon and sea trout'],
      ['Senior', 'Trout and coarse', '2', 'Trout and coarse, up to 2 rods'],
      ['Senior', 'Trout and coarse', '3', 'Trout and coarse, up to 3 rods']
    ])(
      'should return same result as concessionHelper, if licenceType includes concession hasJunior or hasSenior',
      async (concession, type, numOfRods, expectedResult) => {
        const request = {
          cache: () => ({
            helpers: {
              status: { getCurrentPermission: () => mockStatus },
              transaction: { getCurrentPermission: () => mockTransaction }
            }
          })
        }
        const mockStatus = mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
        const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
          licenceStartDate: mockStatus.renewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri,
          licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
          licenceLength: '12M',
          permit: {
            cost: 6
          },
          concessions: {
            concession,
            find: jest.fn(c => {
              return c.type === 'disabled'
            })
          },
          licenceType: type,
          numberOfRods: numOfRods
        }))
        const result = await getData(mockRequest(request))
        expect(result.licenceTypeStr).toBe(expectedResult)
      }
    )

    it('should return isContinuing as true if renewedEndDate is equal to licenceStartDate', async () => {
      const request = {
        cache: () => ({
          helpers: {
            status: { getCurrentPermission: () => mockStatus },
            transaction: { getCurrentPermission: () => mockTransaction }
          }
        })
      }
      const mockStatus = mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true }))
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        permit: {
          cost: 6
        },
        renewedEndDate: '2022-06-22T14:48:00.000Z',
        licenceStartDate: '2022-06-22T14:48:00.000Z'
      }))
      const result = await getData(mockRequest(request))
      expect(result.isContinuing).toBeTruthy()
    })

    it('should return isContinuing as false if both renewedEndDate is not equal to licenceStartDate', async () => {
      const request = {
        cache: () => ({
          helpers: {
            status: { getCurrentPermission: () => mockStatus },
            transaction: { getCurrentPermission: () => mockTransaction }
          }
        })
      }
      const mockStatus = mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true }))
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        permit: {
          cost: 6
        },
        renewedEndDate: '2022-06-22T14:48:00.000Z',
        licenceStartDate: '2022-07-22T15:48:00.000Z'
      }))
      const result = await getData(mockRequest(request))
      expect(result.isContinuing).toBeFalsy()
    })

    it('should return true if a concession has been selected and only if disabled', async () => {
      const request = {
        cache: () => ({
          helpers: {
            status: { getCurrentPermission: () => mockStatus },
            transaction: { getCurrentPermission: () => mockTransaction }
          }
        })
      }
      const mockStatus = mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true }))
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        permit: {
          cost: 6
        },
        concessions: [
          {
            type: CONCESSION.DISABLED
          }
        ]
      }))
      const result = await getData(mockRequest(request))
      expect(result.disabled).toBeTruthy()
    })

    it('should return RENEWAL_START_DATE uri if renewal is true', async () => {
      const request = {
        cache: () => ({
          helpers: {
            status: { getCurrentPermission: () => mockStatus },
            transaction: { getCurrentPermission: () => mockTransaction }
          }
        })
      }
      const mockStatus = mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: true }))
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licenceStartDate: mockStatus.renewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri,
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        numberOfRods: '3',
        licenceLength: '12M',
        permit: {
          cost: 6
        },
        licenceType: 'Salmon and sea trout'
      }))
      const result = await getData(mockRequest(request))
      expect(result.uri.licenceStartDate).toBe(RENEWAL_START_DATE.uri)
    })

    it('should return LICENCE_TO_START uri if renewal is false', async () => {
      const request = {
        cache: () => ({
          helpers: {
            status: { getCurrentPermission: () => mockStatus },
            transaction: { getCurrentPermission: () => mockTransaction }
          }
        })
      }
      const mockStatus = mockStatusCacheGet.mockImplementationOnce(() => ({ renewal: false }))
      const mockTransaction = mockTransactionCacheGet.mockImplementationOnce(() => ({
        licenceStartDate: mockStatus.renewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri,
        licensee: { firstName: 'John', lastName: 'Smith', birthDate: '1996-01-01' },
        numberOfRods: '3',
        licenceLength: '12M',
        permit: {
          cost: 6
        },
        licenceType: 'Salmon and sea trout'
      }))
      const result = await getData(mockRequest(request))
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
        licenceLength: undefined
      }
      expect(() => checkNavigation(permission)).toThrow(GetDataRedirect)
    })
  })
})
