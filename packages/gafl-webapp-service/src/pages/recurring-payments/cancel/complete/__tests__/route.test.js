import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_COMPLETE } from '../../../../../uri.js'
import moment from 'moment-timezone'
import { cacheDateFormat, dateDisplayFormat } from '../../../../../processors/date-and-time-display.js'

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_COMPLETE: { page: Symbol('cancel-rp-complete-page'), uri: Symbol('cancel-rp-complete-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')
const mockFormat = jest.fn()
jest.mock('moment-timezone', () => jest.fn(() => ({ format: mockFormat })))
jest.mock('../../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: Symbol('cache-date-format'),
  dateDisplayFormat: Symbol('date-display-format')
}))

require('../route.js')

// eslint-disable-next-line no-unused-vars
const [[_v, _p, validator, completion, getData]] = pageRoute.mock.calls

describe('pageRoute receives expected arguments', () => {
  it('passes CANCEL_RP_COMPLETE.page as the view name', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        CANCEL_RP_COMPLETE.page,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })
  })

  it('passes CANCEL_RP_COMPLETE.uri as the path', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        CANCEL_RP_COMPLETE.uri,
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })
  })

  it('passes a function as the validator', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.any(Function),
        expect.anything(),
        expect.anything()
      )
    })
  })

  it('passes a function to generate redirect location on completion', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.any(Function),
        expect.anything()
      )
    })
  })

  it('passes a function to get the page data', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.any(Function)
      )
    })
  })
})

// minimal specs that call the inline validator and completion callbacks
// so the route wiring guarantees those hooks remain callable
describe('validator', () => {
  it('is a callable no-op', () => {
    expect(validator()).toBeUndefined()
  })
})

describe('completion handler', () => {
  it('is a callable no-op', () => {
    expect(completion()).toBeUndefined()
  })
})

describe('getData', () => {
  const endDate = '2026-02-03'
  const locale = 'cy'
  const formatted = '3 February 2026'

  const getMockRequest = ({ endDate: overrideEndDate = endDate, locale: overrideLocale = locale } = {}) => {
    const getCurrentPermission = jest.fn().mockResolvedValue({ permission: { endDate: overrideEndDate } })
    return {
      locale: overrideLocale,
      cache: () => ({
        helpers: {
          transaction: {
            getCurrentPermission
          }
        }
      })
    }
  }

  const ctx = {}

  beforeEach(async () => {
    moment.mockClear()
    mockFormat.mockReset()
    mockFormat.mockReturnValue(formatted)
    ctx.request = getMockRequest()
    ctx.data = await getData(ctx.request)
  })

  it('retrieves the current permission once', () => {
    expect(ctx.request.cache().helpers.transaction.getCurrentPermission).toHaveBeenCalledTimes(1)
  })

  it('passes the cached end date and locale to moment', () => {
    expect(moment).toHaveBeenCalledWith(endDate, cacheDateFormat, locale)
  })

  it('formats the expiry using the shared display format', () => {
    expect(mockFormat).toHaveBeenCalledWith(dateDisplayFormat)
  })

  it('returns the formatted licence expiry', () => {
    expect(ctx.data).toEqual({ licenceExpiry: formatted })
  })
})
