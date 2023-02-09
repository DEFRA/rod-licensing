import { getData, getLicenceToStartAndLicenceStartTime } from '../route.js'
// import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
// import { dateFormats, PAGE_STATE } from '../../../../constants.js'
import { RENEWAL_START_DATE, LICENCE_SUMMARY } from '../../../../uri.js'
import moment from 'moment-timezone'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
// import { licenceToStart } from '../../../licence-details/licence-to-start/update-transaction.js'
import { ageConcessionHelper } from '../../../../processors/concession-helper.js'
import { displayExpiryDate } from '../../../../processors/date-and-time-display.js'
// import { errorShimm } from '../../../../handlers/page-handler.js'

const mockDisplayExpiryDate = Symbol('displayExpiryDate')
jest.mock('../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: 'YYYY-MM-DD',
  displayExpiryDate: jest.fn(() => mockDisplayExpiryDate)
}))

jest.mock('../../../../processors/concession-helper.js', () => ({
  ageConcessionHelper: jest.fn()
}))

// jest.mock('../../../../handlers/page-handler.js', () => ({ errorShimm: () => {} }))

jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn((_request, uri) => uri)
}))

jest.mock('moment-timezone')
// const getMomentMockImpl = (overrides = {}) =>
//   jest.fn(() => ({
//     tz: () => ({
//       isSame: () => {}
//     }),
//     isSame: () => {},
//     utc: jest.fn(() => ({ tz: () => {} })),
//     format: () => {},
//     ...overrides
//   }))

const mockTransactionSet = jest.fn()

const getMockRequest = (permission = getSamplePermission()) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: jest.fn(),
        setCurrentPermission: jest.fn()
      },
      page: {
        getCurrentPermission: async () => ({
          payload: {
            'licence-start-date-year': 1999,
            'licence-start-date-month': 1,
            'licence-start-date-day': 1
          }
        }),
        setCurrentPermission: jest.fn()
      },
      transaction: {
        getCurrentPermission: () => permission,
        setCurrentPermission: mockTransactionSet
      }
    }
  }),
  i18n: {
    getCatalog: () => [],
    getLocales: () => []
  },
  url: {
    search: '?lang=cy'
  }
})

const getSamplePermission = ({ renewedEndDate = '2023-01-01T00:00:00.000Z' } = {}) => ({
  licensee: {
    noLicenceRequired: {}
  },
  renewedEndDate: renewedEndDate
})

describe('getData', () => {
  beforeEach(jest.clearAllMocks)

  it('displayExpiryDate return value', async () => {
    const expiryDate = Symbol('expiryDate')
    displayExpiryDate.mockReturnValue(expiryDate)
    const expected = await getData(getMockRequest())
    expect(expected.expiryTimeString).toBe(expiryDate)
  })

  it('displayExpiryDate is called with expected arguments', async () => {
    const permission = getSamplePermission()
    const request = getMockRequest()
    await getData(request)
    expect(displayExpiryDate).toHaveBeenCalledWith(request, permission)
  })

  it('getData returns expected outputs', async () => {
    const expected = await getData(getMockRequest())
    expect(expected).toMatchSnapshot()
  })
})

describe('getLicenceToStartAndLicenceStartTime', () => {
  beforeEach(jest.clearAllMocks)

  it('ageConcessionHelper is called with expected arguments', async () => {
    const result = 'result'
    await getLicenceToStartAndLicenceStartTime(result, getMockRequest())
    expect(ageConcessionHelper).toHaveBeenCalled()
  })

  it.each([
    [RENEWAL_START_DATE.uri, true],
    [LICENCE_SUMMARY.uri, false]
  ])('addLanguageCodeToUri is called with request and %s', async (uri, error) => {
    const result = { error: error }
    const request = getMockRequest()
    await getLicenceToStartAndLicenceStartTime(result, request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri)
  })

  // it('addLanguageCodeToUri test', async () => {
  //   const result = { error: { details: 'error' } }
  //   const request = getMockRequest()
  //   await getLicenceToStartAndLicenceStartTime(result, request)
  //   expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, RENEWAL_START_DATE.uri)
  // })

  it('addLanguageCodeToUri is called with expected arguments', async () => {
    const result = 'result'
    const request = getMockRequest()
    await getLicenceToStartAndLicenceStartTime(result, request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, 'uri')
  })

  it('redirects to the start page when validation fails', async () => {
    const result = { error: true }
    const request = getMockRequest()
    const expected = await getLicenceToStartAndLicenceStartTime(result, request)

    expect(expected).toBe(RENEWAL_START_DATE.uri)
  })

  it('redirects to the licence summary page when validation passes', async () => {
    const result = { error: false }
    const request = getMockRequest()
    const expected = await getLicenceToStartAndLicenceStartTime(result, request)

    expect(expected).toBe(LICENCE_SUMMARY.uri)
  })
})

describe('licenceStartTime and licenceToStart values', () => {
  describe.each([
    ['licenceStartTime = endDateMoment.hours and licenceToStart = ANOTHER_DATE', Symbol('end hours'), 'another-date', true, true],
    ['licenceStartTime = null and licenceToStart = AFTER_PAYMENT', null, 'after-payment', true, false],
    ['licenceStartTime = 0 and licenceToStart = ANOTHER_DATE', 0, 'another-date', false, false]
  ])(
    'returns values of: %s', (desc, endHours, licenceToStartResult, isSame, isAfter) => {
      moment.mockReturnValue({
        isSame: () => isSame,
        format: () => {},
        tz: () => 'Europe/London'
      })

      moment.utc.mockReturnValue({
        tz: () => ({
          isAfter: () => isAfter,
          hours: () => endHours,
          tz: () => 'Europe/London'
        })
      })

      beforeEach(jest.clearAllMocks)

      it('licenceStartTime', async () => {
        await getLicenceToStartAndLicenceStartTime({ error: false }, getMockRequest())
        expect(mockTransactionSet).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceStartTime: endHours
          })
        )
      })

      it('licenceToStart', async () => {
        await getLicenceToStartAndLicenceStartTime({ error: false }, getMockRequest())
        expect(mockTransactionSet).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceToStart: licenceToStartResult
          })
        )
      })
    })
})
