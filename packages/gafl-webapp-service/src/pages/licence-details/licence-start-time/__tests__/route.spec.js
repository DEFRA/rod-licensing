import route from '../route.js'
import moment from 'moment-timezone'
import pageRoute from '../../../../routes/page-route.js'
import { cacheDateFormat } from '../../../../processors/date-and-time-display.js'

jest.mock('../../../../routes/page-route.js', () =>
  jest.fn(() => [
    {
      method: 'POST',
      options: {}
    }
  ])
)

jest.mock('../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: 'YYYY-MM-DD'
}))

jest.mock('moment-timezone')
const realMoment = jest.requireActual('moment-timezone')

const getMomentMockImpl = (overrides = {}) =>
  jest.fn(() => ({
    tz: () => ({ isSame: () => {} }),
    format: () => {},
    ...overrides
  }))

describe('Licence start time data validation', () => {
  const validator = pageRoute.mock.calls[1][2]

  afterEach(() => jest.clearAllMocks)
  it.each([
    ['0', '2021-11-10', '2021-11-10T00:00:00.000Z'],
    ['1', '2021-11-10', '2021-11-10T01:31:00.000Z'],
    ['2', '2021-11-10', '2021-11-10T02:00:00.000Z'],
    ['3', '2021-11-10', '2021-11-10T02:31:00.000Z'],
    ['4', '2021-11-10', '2021-11-10T03:31:00.000Z'],
    ['5', '2021-11-10', '2021-11-10T04:31:00.000Z'],
    ['6', '2021-11-10', '2021-11-10T05:31:00.000Z'],
    ['7', '2021-11-10', '2021-11-10T06:31:00.000Z'],
    ['8', '2021-11-10', '2021-11-10T07:31:00.000Z'],
    ['9', '2021-11-10', '2021-11-10T08:31:00.000Z'],
    ['10', '2021-11-10', '2021-11-10T09:31:00.000Z'],
    ['11', '2021-11-10', '2021-11-10T10:31:00.000Z'],
    ['12', '2021-11-10', '2021-11-10T11:31:00.000Z'],
    ['13', '2021-11-10', '2021-11-10T12:31:00.000Z'],
    ['14', '2021-11-10', '2021-11-10T13:31:00.000Z'],
    ['15', '2021-11-10', '2021-11-10T14:31:00.000Z'],
    ['16', '2021-11-10', '2021-11-10T15:31:00.000Z'],
    ['17', '2021-11-10', '2021-11-10T16:31:00.000Z'],
    ['18', '2021-11-10', '2021-11-10T17:31:00.000Z'],
    ['19', '2021-11-10', '2021-11-10T18:31:00.000Z'],
    ['20', '2021-11-10', '2021-11-10T19:31:00.000Z'],
    ['21', '2021-11-10', '2021-11-10T20:31:00.000Z'],
    ['22', '2021-11-10', '2021-11-10T21:31:00.000Z'],
    ['23', '2021-11-10', '2021-11-10T22:31:00.000Z']
  ])('validation fails for start time of %s when permission date is %s and current date and time is %s', (hour, licenceStartDate, now) => {
    moment.mockImplementation((date, format) => {
      if (date) {
        return realMoment(date, format)
      }
      return realMoment(now, format)
    })

    return expect(() => validator({ 'licence-start-time': hour }, getMockOptions(licenceStartDate))).toThrow()
  })

  it.each([
    ['0', '2021-11-10', '2021-11-09T23:29:00.000Z'],
    ['1', '2021-11-10', '2021-11-10T00:29:00.000Z'],
    ['2', '2021-11-10', '2021-11-10T01:29:00.000Z'],
    ['3', '2021-11-10', '2021-11-10T02:29:00.000Z'],
    ['4', '2021-11-10', '2021-11-10T03:29:00.000Z'],
    ['5', '2021-11-10', '2021-11-10T04:29:00.000Z'],
    ['6', '2021-11-10', '2021-11-10T05:29:00.000Z'],
    ['7', '2021-11-10', '2021-11-10T06:29:00.000Z'],
    ['8', '2021-11-10', '2021-11-10T07:29:00.000Z'],
    ['9', '2021-11-10', '2021-11-10T08:29:00.000Z'],
    ['10', '2021-11-10', '2021-11-10T09:29:00.000Z'],
    ['11', '2021-11-10', '2021-11-10T10:29:00.000Z'],
    ['12', '2021-11-10', '2021-11-10T11:29:00.000Z'],
    ['13', '2021-11-10', '2021-11-10T12:29:00.000Z'],
    ['14', '2021-11-10', '2021-11-10T13:29:00.000Z'],
    ['15', '2021-11-10', '2021-11-10T14:29:00.000Z'],
    ['16', '2021-11-10', '2021-11-10T15:29:00.000Z'],
    ['17', '2021-11-10', '2021-11-10T16:29:00.000Z'],
    ['18', '2021-11-10', '2021-11-10T17:29:00.000Z'],
    ['19', '2021-11-10', '2021-11-10T18:29:00.000Z'],
    ['20', '2021-11-10', '2021-11-10T19:29:00.000Z'],
    ['21', '2021-11-10', '2021-11-10T20:29:00.000Z'],
    ['22', '2021-11-10', '2021-11-10T21:29:00.000Z'],
    ['23', '2021-11-10', '2021-11-10T22:29:00.000Z'],
    ['1', '2021-10-31', '2021-10-31T01:29:00.000']
  ])(
    'validation succeeds for start time of %s when permission date is %s and current date and time is %s',
    (hour, licenceStartDate, now) => {
      const realMoment = jest.requireActual('moment-timezone')
      moment.mockImplementation((date, format) => {
        if (date) {
          return realMoment(date, format)
        }
        return realMoment(now, format)
      })

      return expect(validator({ 'licence-start-time': hour }, getMockOptions(licenceStartDate))).toBeUndefined()
    }
  )

  const getMockOptions = licenceStartDate => ({
    context: {
      app: {
        request: {
          permission: {
            licenceStartDate
          }
        }
      }
    }
  })
})

describe('licenceStartTimeRoute > onPostAuth', () => {
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

  const getMockResponseToolkit = () => ({
    continue: Symbol('continue')
  })
  const getMockRequest = (licenceStartDate = realMoment().format('YYYY-MM-DD')) => ({
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
})

describe('getData', () => {
  const getData = pageRoute.mock.calls[1][4]
  const mockTransactionCacheGet = jest.fn()
  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    }),
    locale: 'en-gb'
  }

  it('startDateStr is result of moment().format()', async () => {
    const formatSymbol = Symbol('formatResult')
    moment.mockImplementation(
      getMomentMockImpl({
        format: () => formatSymbol
      })
    )
    mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceStartDate: '2020-01-01' }))
    const { startDateStr } = await getData({
      cache: () => ({
        helpers: {
          transaction: {
            getCurrentPermission: mockTransactionCacheGet
          }
        }
      }),
      locale: 'anywhere'
    })
    expect(startDateStr).toEqual(formatSymbol)
  })

  it('permission licence start date is passed to moment', async () => {
    const licenceStartDate = Symbol('licenceStartDate')
    mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceStartDate }))
    moment.mockImplementation(getMomentMockImpl())
    await getData(mockRequest)
    expect(moment).toHaveBeenCalledWith(licenceStartDate, expect.any(String), expect.any(String))
  })

  it('cacheDateFormat being what is expected', async () => {
    mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceStartDate: '2020-01-01' }))
    moment.mockImplementation(getMomentMockImpl())
    await getData(mockRequest)
    expect(moment).toHaveBeenCalledWith(expect.any(String), cacheDateFormat, expect.any(String))
  })

  it('dddd, Do MMMM, YYYY is passed to format', async () => {
    mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceStartDate: '2020-01-01' }))
    const format = jest.fn()
    moment.mockImplementation(getMomentMockImpl({ format }))
    await getData(mockRequest)
    expect(format).toHaveBeenCalledWith('dddd, Do MMMM, YYYY')
  })

  it('locale is set on moment, to whatever the request.locale is', async () => {
    const language = Symbol('locale')
    const mockRequest = {
      cache: () => ({
        helpers: {
          transaction: {
            getCurrentPermission: mockTransactionCacheGet
          }
        }
      }),
      locale: language
    }
    mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceStartDate: '2020-01-01' }))
    const format = jest.fn()
    moment.mockImplementation(getMomentMockImpl({ format }))
    await getData(mockRequest)
    expect(moment).toHaveBeenCalledWith(expect.any(String), expect.any(String), language)
  })
})
