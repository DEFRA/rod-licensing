import { getData, getLicenceToStartAndLicenceStartTime, validator } from '../route.js'
import { RENEWAL_START_DATE, LICENCE_SUMMARY } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { ageConcessionHelper } from '../../../../processors/concession-helper.js'
import { displayExpiryDate } from '../../../../processors/date-and-time-display.js'

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

jest.mock('../../../../handlers/page-handler.js', () => ({
  errorShimm: () => {}
}))

jest.mock('../../../../routes/page-route.js')

const mockTransactionSet = jest.fn()

const getMockRequest = (permission = getSamplePermission(), year, month, day) => ({
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

const getSamplePermission = ({ renewedEndDate = '2023-01-10:00:00.000Z' } = {}) => ({
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
    [RENEWAL_START_DATE.uri, 'fails', true],
    [LICENCE_SUMMARY.uri, 'passes', false]
  ])('addLanguageCodeToUri is called with request and %s when validation %s', async (uri, desc, error) => {
    const result = { error: error }
    const request = getMockRequest()
    await getLicenceToStartAndLicenceStartTime(result, request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri)
  })
})

describe('licenceStartTime and licenceToStart values', () => {
  describe.each([
    [
      'licenceStartTime = endDateMoment.hours and licenceToStart = ANOTHER_DATE',
      13,
      'another-date',
      '2023-02-10T12:00:00.000Z',
      '2023-02-10T13:00:00.000Z',
      '2023',
      '02',
      '10'
    ],
    [
      'licenceStartTime = null and licenceToStart = AFTER_PAYMENT',
      null,
      'after-payment',
      '2023-02-10T12:00:00.000Z',
      '2023-02-10T11:00:00.000Z',
      '2023',
      '02',
      '10'
    ],
    [
      'licenceStartTime = 0 and licenceToStart = ANOTHER_DATE',
      0,
      'another-date',
      '2023-02-11T12:00:00.000Z',
      '2023-02-10T12:00:00.000Z',
      '2023',
      '02',
      '11'
    ]
  ])('returns values of: %s', (desc, endHours, licenceToStartResult, licenceStartDate, renewedEndDate, year, month, day) => {
    it('licenceStartTime', async () => {
      const permission = { licenceStartDate: licenceStartDate, renewedEndDate: renewedEndDate }
      await getLicenceToStartAndLicenceStartTime({ error: false }, getMockRequest(permission, year, month, day))
      expect(mockTransactionSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceStartTime: endHours
        })
      )
    })

    it('licenceToStart', async () => {
      const permission = { licenceStartDate: licenceStartDate, renewedEndDate: renewedEndDate }
      await getLicenceToStartAndLicenceStartTime({ error: false }, getMockRequest(permission, year, month, day))
      expect(mockTransactionSet).toHaveBeenCalledWith(
        expect.objectContaining({
          licenceToStart: licenceToStartResult
        })
      )
    })
  })
})

describe('validator', () => {
  const getMockOptions = renewedEndDate => ({
    context: {
      app: {
        request: {
          permission: {
            renewedEndDate
          }
        }
      }
    }
  })

  it('validation fails', () => {
    return expect(() =>
      validator(
        { 'licence-start-date-year': 1990, 'licence-start-date-month': 11, 'licence-start-date-day': 11 },
        getMockOptions('1990-10-10')
      )
    ).toThrow()
  })

  it('validation succeeds', () => {
    return expect(
      validator(
        { 'licence-start-date-year': 1990, 'licence-start-date-month': 2, 'licence-start-date-day': 1 },
        getMockOptions('1990-02-01')
      )
    ).toBeUndefined()
  })
})