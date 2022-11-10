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
import '../../find-permit.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import moment from 'moment-timezone'

jest.mock('../../find-permit.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/uri-helper.js')
jest.mock('../../../../processors/date-and-time-display.js', () => ({
  displayStartTime: jest.fn(),
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

const getMockRequest = (currentPermission = getMockPermission()) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: () => ({}),
        setCurrentPermission: () => {}
      },
      transaction: {
        getCurrentPermission: async () => currentPermission,
        setCurrentPermission: () => {}
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
})

const getMockPermission = (licenseeOverrides = {}) => ({
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
    firstName: 'Brenin',
    lastName: 'Pysgotwr'
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

const getMockNonRenewalPermission = () => ({
  ...getMockPermission(),
  isRenewal: false
})

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
    it('should return a summary table with required data for page', async () => {
      const result = await getData(getMockRequest())
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
    ])('addLanguageCodeToUri is called with the request and %s', async uri => {
      const mockRequest = getMockRequest()
      await getData(mockRequest)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, uri)
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

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const mockTypeDisplayValue = Symbol('type display return value')
      licenceTypeDisplay.mockReturnValueOnce(mockTypeDisplayValue)
      const { licenceTypeStr } = await getData(getMockRequest())
      expect(licenceTypeStr).toBe(mockTypeDisplayValue)
    })

    it('birthDateStr should return locale-specific date string', async () => {
      const expectedLocale = Symbol('expected locale')
      const locale = jest.fn(() => ({ format: () => 'locale-aware birth date' }))
      moment.mockImplementation(() => ({
        ...mockMomentImpl,
        locale
      }))
      const mockRequest = {
        ...getMockRequest(),
        locale: expectedLocale
      }

      await getData(mockRequest)

      expect(locale).toHaveBeenCalledWith(expectedLocale)

      moment.mockImplementation(() => mockMomentImpl)
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
        ...getMockNonRenewalPermission(),
        ...permission
      })
      await expect(() => getData(mockRequest)).rejects.toThrowRedirectTo(uri)
    })
  })
})
