import { getData } from '../route'
import { LICENCE_SUMMARY_SEEN } from '../../../../constants.js'
import { DATE_OF_BIRTH, LICENCE_LENGTH, LICENCE_TO_START, LICENCE_TYPE, NAME, NEW_TRANSACTION } from '../../../../uri.js'
import findPermit from '../../../../processors/find-permit.js'
import hashPermission from '../../../../processors/hash-permission.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import mappingConstants from '../../../../processors/mapping-constants.js'
import { displayPermissionPrice } from '../../../../processors/price-display.js'
import { hasJunior } from '../../../../processors/concession-helper.js'

jest.mock('../../../../processors/concession-helper.js', () => ({
  hasJunior: jest.fn(() => false)
}))
jest.mock('../../../../processors/licence-type-display.js', () => ({
  licenceTypeDisplay: jest.fn(() => 'Special Canal Licence, Shopping Trollies and Old Wellies')
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
jest.mock('../../../../processors/find-permit.js')
jest.mock('../../../../processors/hash-permission.js')
jest.mock('../../../../processors/price-display.js', () => ({
  displayPermissionPrice: jest.fn(() => '#6')
}))

const getMockRequest = ({
  currentPermission = getMockPermission(),
  statusCache = {},
  statusCacheSet = () => {},
  transactionCacheSet = () => {}
} = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: async () => statusCache,
        setCurrentPermission: statusCacheSet
      },
      transaction: {
        getCurrentPermission: async () => currentPermission,
        setCurrentPermission: transactionCacheSet
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
  numberOfRods: '2',
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
  beforeAll(() => {
    hashPermission.mockReturnValue('lkjhgfdertyu0987654rftghj')
  })
  beforeEach(jest.clearAllMocks)

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
    ])('calls findPermit with permission where permission is a $desc permission', async ({ currentPermission }) => {
      const mockRequest = getMockRequest({ currentPermission })
      await getData(mockRequest)
      expect(findPermit).toHaveBeenCalledWith(currentPermission)
    })

    it('attaches the permit to the permission', async () => {
      const currentPermisison = getMockPermission()
      const mockRequest = getMockRequest({ currentPermisison })
      const permit = { cost: 10 }
      hashPermission.mockReturnValueOnce('dfghj3456789')
      findPermit.mockReturnValueOnce(permit)

      await getData(mockRequest)

      expect(displayPermissionPrice).toHaveBeenCalledWith(expect.objectContaining({ permit }), expect.any(Object))
    })

    it('hashes the permission', async () => {
      const currentPermission = getMockPermission()
      const mockRequest = getMockRequest({ currentPermission })
      const hash = Symbol('hash')
      hashPermission.mockReturnValueOnce(hash)

      await getData(mockRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(expect.objectContaining({ hash }), expect.any(Object))
    })

    it('passes the permission to the hash function', async () => {
      const currentPermission = getMockPermission()
      await getData(getMockRequest({ currentPermission }))
      expect(hashPermission).toHaveBeenCalledWith(currentPermission)
    })

    it('only retrieves the permit if the hash has changed', async () => {
      const hash = Symbol('hash')
      const currentPermission = { ...getMockPermission(), hash }
      const mockRequest = getMockRequest({ currentPermission })
      hashPermission.mockReturnValueOnce(hash)
      await getData(mockRequest)

      expect(findPermit).not.toHaveBeenCalled()
    })

    it('persists modified permission', async () => {
      const hash = Symbol('hash')
      const currentPermission = getMockPermission()
      const transactionCacheSet = jest.fn()
      const mockRequest = getMockRequest({ currentPermission, transactionCacheSet })
      const permit = { cost: 10 }
      hashPermission.mockReturnValueOnce(hash)
      findPermit.mockReturnValueOnce(permit)

      await getData(mockRequest)

      expect(transactionCacheSet).toHaveBeenCalledWith(expect.objectContaining({ ...currentPermission, permit, hash }))
    })

    it("doesn't persist modified permission if hash hasn't changed", async () => {
      const currentPermission = getMockPermission()
      currentPermission.hash = hashPermission()
      const transactionCacheSet = jest.fn()
      const mockRequest = getMockRequest({ currentPermission, transactionCacheSet })

      await getData(mockRequest)

      expect(transactionCacheSet).not.toHaveBeenCalled()
    })

    it('addLanguageCodeToUri is called with request and NEW_TRANSACTION.uri', async () => {
      const mockRequest = getMockRequest()
      await getData(mockRequest)
      expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, NEW_TRANSACTION.uri)
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

  it('uses displayPermissionPrice for permissionPrice', async () => {
    const displayPrice = Symbol('display price')
    displayPermissionPrice.mockReturnValueOnce(displayPrice)
    const data = await getData(getMockRequest())
    expect(data.licenceSummaryRows.pop().value.html).toBe(displayPrice)
  })

  it('passes permission and labels to displayPermissionPrice', async () => {
    const currentPermission = getMockNewPermission()
    currentPermission.licenceStartDate = Symbol('licence start date')
    currentPermission.permit = Symbol('permit')
    const mockRequest = getMockRequest({ currentPermission })
    const catalog = mockRequest.i18n.getCatalog()

    await getData(mockRequest)

    expect(displayPermissionPrice).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: currentPermission.licenceStartDate,
        permit: currentPermission.permit
      }),
      catalog
    )
  })

  it('calls hasJunior with permission', async () => {
    const currentPermission = getMockNewPermission()
    const mockRequest = getMockRequest({ currentPermission })

    await getData(mockRequest)

    expect(hasJunior).toHaveBeenCalledWith(currentPermission)
  })

  describe('licence summary rows', () => {
    it.each`
      desc                               | currentPermission                                             | junior
      ${'1 year renewal'}                | ${getMockPermission()}                                        | ${false}
      ${'1 year new licence'}            | ${getMockNewPermission()}                                     | ${false}
      ${'1 year senior renewal'}         | ${getMockSeniorPermission()}                                  | ${false}
      ${'8 day licence'}                 | ${{ ...getMockNewPermission(), licenceLength: '8D' }}         | ${false}
      ${'1 day licence'}                 | ${{ ...getMockNewPermission(), licenceLength: '1D' }}         | ${false}
      ${'Junior licence'}                | ${getMockJuniorPermission()}                                  | ${true}
      ${'Blue badge concession'}         | ${getMockBlueBadgePermission()}                               | ${false}
      ${'Continuing permission'}         | ${getMockContinuingPermission()}                              | ${false}
      ${'Another date permission'}       | ${{ ...getMockPermission(), licenceToStart: 'another-date' }} | ${false}
      ${'1 year new three rod licence '} | ${{ ...getMockNewPermission(), numberOfRods: '3' }}           | ${false}
    `('creates licence summary name rows for $desc', async ({ currentPermission, junior }) => {
      hasJunior.mockReturnValueOnce(junior)
      const mockRequest = getMockRequest({ currentPermission })
      const data = await getData(mockRequest)
      expect(data.licenceSummaryRows).toMatchSnapshot()
    })
  })
})
