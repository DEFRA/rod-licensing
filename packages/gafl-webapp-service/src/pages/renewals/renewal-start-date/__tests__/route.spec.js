import pageRoute from '../../../../routes/page-route.js'
import { LICENCE_SUMMARY } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { ageConcessionHelper } from '../../../../processors/concession-helper.js'
import { displayExpiryDate } from '../../../../processors/date-and-time-display.js'
import route from '../route.js'

jest.mock('../../../../routes/page-route.js', () =>
  jest.fn(() => [
    {
      method: 'POST',
      options: {}
    }
  ])
)

const mockDisplayExpiryDate = Symbol('displayExpiryDate')
jest.mock('../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: 'YYYY-MM-DD',
  displayExpiryDate: jest.fn(() => mockDisplayExpiryDate)
}))

jest.mock('../../../../processors/concession-helper.js', () => ({
  ageConcessionHelper: jest.fn()
}))

jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn((_request, uri) => uri)
}))

jest.mock('moment-timezone', () => {
  const realMoment = jest.requireActual('moment-timezone')
  const momentMock = function (targetDate) {
    if (targetDate) {
      return realMoment(targetDate)
    }
    return realMoment('2023-02-10T12:00:00.000Z')
  }
  momentMock.utc = realMoment.utc
  return momentMock
})

jest.mock('../../../../routes/page-route.js')

const mockTransactionSet = jest.fn()

const getMockRequest = ({ permission = getSamplePermission(), year = '2025', month = '1', day = '01', error = null } = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: jest.fn(),
        setCurrentPermission: jest.fn()
      },
      page: {
        getCurrentPermission: async () => ({
          payload: {
            'licence-start-date-year': year,
            'licence-start-date-month': month,
            'licence-start-date-day': day
          },
          error
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
    getCatalog: () => getMessages(),
    getLocales: () => []
  },
  url: {
    search: '?lang=cy'
  }
})

const getMessages = () => ({
  and: 'and',
  renewal_start_date_error_hint: 'Renewal start date error hint',
  renewal_start_date_error_max_1: 'Renewal start date error max 1 ',
  renewal_start_date_error_max_2: ' renewal start date error max 2'
})

const getSamplePermission = ({ renewedEndDate = '2023-01-10:00:00.000Z' } = {}) => ({
  licensee: {
    noLicenceRequired: {}
  },
  renewedEndDate: renewedEndDate
})

describe('route > onPostAuth', () => {
  const getMockResponseToolkit = () => ({
    continue: Symbol('continue')
  })
  const getMockRequest = (licenceStartDate = '2023-02-11T12:00:00.000Z') => ({
    app: {},
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: async () => ({
            licenceStartDate
          })
        }
      }
    })
  })

  const { onPostAuth } = route.find(r => r.method === 'POST').options.ext
  it('returns reply.continue symbol', async () => {
    const mockResponseToolkit = getMockResponseToolkit()
    expect(await onPostAuth.method(getMockRequest(), mockResponseToolkit)).toEqual(mockResponseToolkit.continue)
  })

  it('adds permission to app key', async () => {
    const mockRequest = getMockRequest()
    const permission = await mockRequest.cache().helpers.transaction.getCurrentPermission()
    await onPostAuth.method(mockRequest, getMockResponseToolkit())
    expect(mockRequest.app.permission).toStrictEqual(permission)
  })
})

describe('getData', () => {
  const getData = pageRoute.mock.calls[0][4]
  beforeEach(jest.clearAllMocks)
  it('expiryTimeString is set to return value of displayExpiryDate', async () => {
    const expiryDate = Symbol('expiryDate')
    displayExpiryDate.mockReturnValue(expiryDate)
    const expected = await getData(getMockRequest())
    expect(expected.expiryTimeString).toBe(expiryDate)
  })

  it('displayExpiryDate is called with request and permission', async () => {
    const permission = getSamplePermission()
    const request = getMockRequest()
    await getData(request)
    expect(displayExpiryDate).toHaveBeenCalledWith(request, permission)
  })

  it.each([
    ['full-date', 'object.missing'],
    ['day', 'any.required']
  ])('should add error details ({%s: %s}) to the page data', async (errorKey, errorValue) => {
    const error = { [errorKey]: errorValue }

    const result = await getData(getMockRequest({ error }))
    expect(result.error).toEqual({ errorKey, errorValue })
  })

  it('omits error if there is no error', async () => {
    const result = await getData(getMockRequest())
    expect(result.error).toBeUndefined()
  })

  it('getData returns expected outputs', async () => {
    const expected = await getData(getMockRequest())
    expect(expected).toMatchSnapshot()
  })
})

describe('setLicenceStartDateAndTime', () => {
  const setLicenceStartDateAndTime = pageRoute.mock.calls[0][3]
  beforeEach(jest.clearAllMocks)

  it('ageConcessionHelper is called with permission', async () => {
    const permission = { licenceStartDate: '2023-02-11T12:00:00.000Z' }
    await setLicenceStartDateAndTime(getMockRequest({ permission }))
    expect(ageConcessionHelper).toHaveBeenCalledWith(permission)
  })

  it('addLanguageCodeToUri is called with request', async () => {
    const request = getMockRequest()
    await setLicenceStartDateAndTime(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, LICENCE_SUMMARY.uri)
  })
})

describe('licenceStartTime and licenceToStart values', () => {
  const setLicenceStartDateAndTime = pageRoute.mock.calls[0][3]
  beforeEach(jest.clearAllMocks)
  describe.each`
    timeDesc          | licenceStartDesc   | reasonDesc                                              | endHours | licenceToStartResult | licenceStartDate              | renewedEndDate                | year      | month  | day
    ${'current time'} | ${'another date'}  | ${'renewal is current day and licence not yet expired'} | ${13}    | ${'another-date'}    | ${'2023-02-10T12:00:00.000Z'} | ${'2023-02-10T13:00:00.000Z'} | ${'2023'} | ${'2'} | ${'10'}
    ${'30 minutes'}   | ${'after payment'} | ${'renewal is current day and licence is expired'}      | ${null}  | ${'after-payment'}   | ${'2023-02-10T12:00:00.000Z'} | ${'2023-02-10T11:00:00.000Z'} | ${'2023'} | ${'2'} | ${'10'}
    ${'midnight'}     | ${'another date'}  | ${'renewal is different day so renewing in advance'}    | ${0}     | ${'another-date'}    | ${'2023-02-11T12:00:00.000Z'} | ${'2023-02-10T12:00:00.000Z'} | ${'2023'} | ${'2'} | ${'11'}
  `(
    'returns values of: licenceStartTime = $timeDesc and licenceToStart = $licenceStartDesc when $reasonDesc',
    ({ endHours, licenceToStartResult, licenceStartDate, renewedEndDate, year, month, day }) => {
      it('licenceStartTime', async () => {
        const permission = { licenceStartDate, renewedEndDate }
        await setLicenceStartDateAndTime(getMockRequest({ permission, year, month, day }))
        expect(mockTransactionSet).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceStartTime: endHours
          })
        )
      })

      it('licenceToStart', async () => {
        const permission = { licenceStartDate: licenceStartDate, renewedEndDate: renewedEndDate }
        await setLicenceStartDateAndTime(getMockRequest({ permission, year, month, day }))
        expect(mockTransactionSet).toHaveBeenCalledWith(
          expect.objectContaining({
            licenceToStart: licenceToStartResult
          })
        )
      })
    }
  )
})
