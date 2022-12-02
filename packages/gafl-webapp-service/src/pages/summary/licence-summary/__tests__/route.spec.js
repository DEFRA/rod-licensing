import { getData } from '../route'
import { LICENCE_SUMMARY_SEEN } from '../../../../constants.js'
import { DATE_OF_BIRTH, LICENCE_LENGTH, LICENCE_TO_START, LICENCE_TYPE, NAME, NEW_TRANSACTION } from '../../../../uri.js'
import findPermit from '../../find-permit.js'
import { licenceTypeDisplay, getErrorPage } from '../../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'
import moment from 'moment-timezone'
import mappingConstants from '../../../../processors/mapping-constants.js'

jest.mock('../../../../processors/licence-type-display.js', () => ({
  licenceTypeDisplay: jest.fn(() => 'Special Canal Licence, Shopping Trollies and Old Wellies'),
  getErrorPage: jest.fn()
}))
jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn((_request, href) => href)
}))
jest.mock('../../../../processors/date-and-time-display.js', () => ({
  displayStartTime: () => '11:45am on 21st October 1805',
  cacheDateFormat: 'YYYY-MM-DD'
}))
const mockMomentImpl = {
  tz: () => ({ isAfter: () => {} }),
  isAfter: () => false,
  locale: () => ({ format: () => '1st January 1946' })
}
jest.mock('moment-timezone', () => jest.fn(() => mockMomentImpl))

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
jest.mock('../../find-permit.js', () => jest.fn())
jest.mock('../../../../handlers/multibuy-for-you-handler.js')

const getMockRequest = ({
  currentPermission = getMockPermission(),
  getTransaction = async () => ({ permissions: [currentPermission] }),
  setCurrentTransactionPermission = () => {},
  statusCache = {},
  statusCacheSet = () => {}
} = {}
) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: async () => statusCache,
        setCurrentPermission: statusCacheSet
      },
      transaction: {
        get: getTransaction,
        getCurrentPermission: async () => currentPermission,
        setCurrentPermission: setCurrentTransactionPermission
      }
    }
  }),
  i18n: {
    getCatalog: () => ({
      licence_type_radio_salmon: 'licence_type_radio_salmon',
      contact_summary_change: 'contact_summary_change',
      licence_summary_name: 'licence_summary_name',
      licence_summary_dob: 'licence_summary_dob',
      licence_summary_type: 'licence_summary_type',
      licence_summary_length: 'licence_summary_length',
      licence_summary_minutes_after_payment: 'licence_summary_minutes_after_payment',
      licence_summary_immediately_after_expire: 'licence_summary_immediately_after_expire',
      licence_summary_none: 'licence_summary_none',
      licence_summary_start_date: 'licence_summary_start_date',
      licence_type_12m: 'licence_type_12m',
      licence_type_8d: 'licence_type_8d',
      licence_type_1d: 'licence_type_1d',
      licence_summary_blue_badge_num: 'licence_summary_blue_badge_num',
      licence_summary_ni_num: 'licence_summary_ni_num',
      licence_summary_disability_concession: 'licence_summary_disability_concession',
      free: 'gratis',
      cost: 'damage',
      pound: '#'
    })
  },
  url: {
    search: ''
  },
  path: '',
  locale: 'en'
})
const getMockPermission = (licenseeOverrides = {}) => ({
  licensee: {
    firstName: 'Brenin',
    lastName: 'Pysgotwr',
    birthDate: '1987-10-12'
  },
  isLicenceForYou: true,
  isRenewal: true,
  concessions: [
    {
      type: mappingConstants.CONCESSION.DISABLED,
      proof: {
        type: mappingConstants.CONCESSION_PROOF.NI,
        referenceNumber: 'AB 12 34 56 A'
      }
    }
  ],
  licenceLength: '12M',
  licenceStartTime: null,
  licenceToStart: 'after-payment',
  licenceStartDate: '2022-11-10',
  licenceType: 'Trout and coarse',
  numberOfRods: '3',
  permit: { cost: 6 }
})

const getMockNewPermission = () => ({
  ...getMockPermission(),
  isRenewal: false
})

const getMockSeniorPermission = () => ({
  ...getMockNewPermission(),
  concessions: [
    {
      type: mappingConstants.SENIOR,
      proof: {
        type: 'Just look at him',
        referenceNumber: 'Spot the fossil'
      }
    }
  ],
  permit: { cost: 3 }
})

const getMockJuniorPermission = () => ({
  ...getMockNewPermission(),
  concessions: [
    {
      type: mappingConstants.JUNIOR,
      proof: {
        type: 'Fresh faced',
        referenceNumber: 'Beardless youth'
      }
    }
  ],
  permit: { cost: 0 }
})

const getMockBlueBadgePermission = () => ({
  ...getMockPermission(),
  concessions: [
    {
      type: mappingConstants.CONCESSION.DISABLED,
      proof: {
        type: mappingConstants.CONCESSION_PROOF.blueBadge,
        referenceNumber: 'AB1 CDE 0 1234F5678'
      }
    }
  ]
})

const getMockContinuingPermission = () => ({
  ...getMockPermission(),
  licenceToStart: 'another-date',
  renewedEndDate: '2022-11-10'
})

describe('licence-summary > route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    getErrorPage.mockReset()
  })

  describe('sets from summary on status cache', () => {
    it('adds LICENCE_SUMMARY_SEEN to status.fromSummary for a renewal', async () => {
      const statusCacheSet = jest.fn()
      const mockRequest = getMockRequest({ statusCacheSet })
      await getData(mockRequest)
      expect(statusCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          fromSummary: LICENCE_SUMMARY_SEEN
        })
      )
    })

    it("persists existing fromSummary if permission isn't a renewal", async () => {
      const statusCacheSet = jest.fn()
      const statusCache = { fromSummary: Symbol('from summary') }
      const mockRequest = getMockRequest({
        currentPermission: getMockNewPermission(),
        statusCache,
        statusCacheSet
      })
      await getData(mockRequest)
      expect(statusCacheSet).toHaveBeenCalledWith(expect.objectContaining(statusCache))
    })

    it("sets fromSummary to LICENCE_SUMMARY_SEEN if permission isn't a renewal and no fromSummary is set", async () => {
      const statusCacheSet = jest.fn()
      const mockRequest = getMockRequest({
        currentPermission: getMockNewPermission(),
        statusCacheSet
      })
      await getData(mockRequest)
      expect(statusCacheSet).toHaveBeenCalledWith(
        expect.objectContaining({
          fromSummary: LICENCE_SUMMARY_SEEN
        })
      )
    })

    it.each([
      { statusCache: { sampleValue: 'abc-123' }, currentPermission: getMockNewPermission() },
      { statusCache: { number: 22, otherValue: false, startDate: '15-12-2022' } },
      { statusCache: { tag: Symbol('prince') }, currentPermission: getMockNewPermission() }
    ])('persists existing status cache values $statusCache', async params => {
      const statusCacheSet = jest.fn()
      const mockRequest = getMockRequest({ ...params, statusCacheSet })
      await getData(mockRequest)
      expect(statusCacheSet).toHaveBeenCalledWith(expect.objectContaining(params.statusCache))
    })
  })

  describe('getData', () => {
    it.each([
      { desc: 'renewal', currentPermission: getMockPermission() },
      { desc: 'new', currentPermission: getMockNewPermission() }
    ])('calls findPermit with permission and request where permission is a $desc permission', async ({ currentPermission }) => {
      const mockRequest = getMockRequest({ currentPermission })
      await getData(mockRequest)
      expect(findPermit).toHaveBeenCalledWith(currentPermission, mockRequest)
    })
    it('addLanguageCodeToUri is called with the request and NEW_TRANSACTION.uri', async () => {
      const mockRequest = getMockRequest()
      await getData(mockRequest)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, NEW_TRANSACTION.uri)
    })

    it("throws a GetDataRedirect if getErrorPage returns a value and it isn't a renewal", async () => {
      const request = getSampleRequest({
        getCurrentTransactionPermission: () => getSamplePermission({ isRenewal: false })
      })
      const redirect = Symbol('error page')
      getErrorPage.mockReturnValueOnce(redirect)

      const testFunction = () => getData(request)

      await expect(testFunction).rejects.toThrowRedirectTo(redirect)
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

      await expect(result).toBeUndefined()
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
    it('birthDateStr should return locale-specific date string', async () => {
      const expectedLocale = Symbol('expected locale')
      const mockRequest = getMockRequest({ currentPermission: getMockNewPermission() })
      const locale = jest.fn(() => ({ format: () => 'locale-aware birth date' }))
      moment.mockImplementationOnce(() => ({
        tz: () => ({ isAfter: () => {} }),
        isAfter: jest.fn(),
        locale
      }))
      mockRequest.locale = expectedLocale

      await getData(mockRequest)

      expect(locale).toHaveBeenCalledWith(expectedLocale)
    })

    it('licenceTypeDisplay is called with the permission and i18n label catalog', async () => {
      const catalog = Symbol('mock catalog')
      const mockRequest = {
        ...getMockRequest(),
        i18n: {
          getCatalog: () => catalog
        }
      }
      const mockPermission = await mockRequest.cache().helpers.transaction.getCurrentPermission()

      await getData(mockRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(mockPermission, catalog)
    })
  })

  describe('checkNavigation', () => {
    it.each`
      notIncluded           | uriName                   | permission                                                                 | uri
      ${'firstName'}        | ${'NAME.uri'}             | ${{ licensee: { ...getMockPermission().licensee, firstName: undefined } }} | ${NAME.uri}
      ${'lastName'}         | ${'NAME.uri'}             | ${{ licensee: { ...getMockPermission().licensee, lastName: undefined } }}  | ${NAME.uri}
      ${'birthDate'}        | ${'DATE_OF_BIRTH.uri'}    | ${{ licensee: { ...getMockPermission().licensee, birthDate: undefined } }} | ${DATE_OF_BIRTH.uri}
      ${'licenceStartDate'} | ${'LICENCE_TO_START.uri'} | ${{ licenceStartDate: undefined }}                                         | ${LICENCE_TO_START.uri}
      ${'numberOfRods'}     | ${'LICENCE_TYPE.uri'}     | ${{ numberOfRods: undefined }}                                             | ${LICENCE_TYPE.uri}
      ${'licenceType'}      | ${'LICENCE_TYPE.uri'}     | ${{ licenceType: undefined }}                                              | ${LICENCE_TYPE.uri}
      ${'licenceLength'}    | ${'LICENCE_LENGTH.uri'}   | ${{ licenceLength: undefined }}                                            | ${LICENCE_LENGTH.uri}
    `('throws a redirect error to $uriName if $notIncluded is not included in permission object', async ({ permission, uri }) => {
      const mockRequest = getMockRequest({
        currentPermission: {
          ...getMockNewPermission(),
          ...permission
        }
      })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(uri)
    })
  })

  describe('shortened multibuy journey', () => {
    beforeAll(() => {
      isMultibuyForYou.mockResolvedValue(true)
    })

    afterAll(() => {
      isMultibuyForYou.mockResolvedValue(false)
    })

    it("copies licensee from existing 'for you' permission to new 'for you' permission", async () => {
      const completedPermission = getMockNewPermission()
      const newPermission = { isLicenceForYou: true, permit: { cost: 30 }, licenceLength: '12M' }
      const mockRequest = getMockRequest({
        currentPermission: newPermission,
        getTransaction: () => ({ permissions: [completedPermission, newPermission] })
      })

      await getData(mockRequest)
      expect(newPermission.licensee).toEqual(completedPermission.licensee)
    })

    it('copies, rather than clones, permission licensee', async () => {
      const completedPermission = getMockNewPermission()
      const newPermission = { isLicenceForYou: true, permit: { cost: 30 }, licenceLength: '12M' }
      const mockRequest = getMockRequest({
        currentPermission: newPermission,
        getTransaction: () => ({ permissions: [completedPermission, newPermission] })
      })
      await getData(mockRequest)
      expect(newPermission.licensee).not.toBe(completedPermission.licensee)
    })

    it('persists the new permission in the transaction cache', async () => {
      const newPermission = { isLicenceForYou: true, permit: { cost: 30 }, licenceLength: '12M' }
      const setCurrentTransactionPermission = jest.fn()

      await getData(
        getMockRequest({
          currentPermission: newPermission,
          getTransaction: () => ({ permissions: [getMockNewPermission(), newPermission] }),
          setCurrentTransactionPermission
        })
      )

      expect(setCurrentTransactionPermission).toHaveBeenCalledWith(newPermission)
    })
  })

  describe('licence summary rows', () => {
    it.each`
      desc                         | currentPermission
      ${'1 year renewal'}          | ${getMockPermission()}
      ${'1 year new licence'}      | ${getMockNewPermission()}
      ${'1 year senior renewal'}   | ${getMockSeniorPermission()}
      ${'8 day licence'}           | ${{ ...getMockNewPermission(), licenceLength: '8D' }}
      ${'1 day licence'}           | ${{ ...getMockNewPermission(), licenceLength: '1D' }}
      ${'Junior licence'}          | ${getMockJuniorPermission()}
      ${'Blue badge concession'}   | ${getMockBlueBadgePermission()}
      ${'Continuing permission'}   | ${getMockContinuingPermission()}
      ${'Another date permission'} | ${{ ...getMockPermission(), licenceToStart: 'another-date' }}
    `('creates licence summary name rows for $desc', async ({ currentPermission }) => {
      const mockRequest = getMockRequest({ currentPermission })
      const data = await getData(mockRequest)
      expect(data.licenceSummaryRows).toMatchSnapshot()
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
