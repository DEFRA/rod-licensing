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
  return {
    default: targetDate => {
      if (targetDate) {
        return realMoment(targetDate)
      }
      return realMoment('2023-02-10T12:00:00.000Z')
    },
    utc: realMoment.utc
  }
})

jest.mock('../../../../handlers/page-handler.js', () => ({
  errorShimm: () => {}
}))

jest.mock('../../../../routes/page-route.js')

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

  it.only('ageConcessionHelper is called with expected arguments', async () => {
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
    ['licenceStartTime = endDateMoment.hours and licenceToStart = ANOTHER_DATE', Symbol('end hours'), 'another-date', '2023-02-10'],
    ['licenceStartTime = null and licenceToStart = AFTER_PAYMENT', null, 'after-payment', '2023-02-10'],
    ['licenceStartTime = 0 and licenceToStart = ANOTHER_DATE', 0, 'another-date', '2023-02-10']
  ])(
    'returns values of: %s', (desc, endHours, licenceToStartResult, licenceStartDate) => {
      beforeEach(jest.clearAllMocks)

      it('licenceStartTime', async () => {
        const permission = { licenceStartDate: licenceStartDate }
        const payload = { 'licence-start-date-year': 2023, 'licence-start-date-month': 2, 'licence-start-date-day': 10 }
        await getLicenceToStartAndLicenceStartTime({ error: false }, getMockRequest(payload, permission))
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

  // it('validation fails', () => {
  //   return expect(validator({ 'licence-start-date-year': 1990, 'licence-start-date-month': 2, 'licence-start-date-day': 1 },
  //     getMockOptions('1990-02-01'))).toThrow()
  // })

  it('validation succeeds', () => {
    return expect(validator({ 'licence-start-date-year': 1990, 'licence-start-date-month': 2, 'licence-start-date-day': 1 },
      getMockOptions('1990-02-01'))).toBeUndefined()
  })
})
