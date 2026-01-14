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
jest.mock('moment-timezone', () => jest.fn(() => ({ format: jest.fn() })))
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

describe('getData', () => {
  const buildRequest = (endDate, locale) => {
    const getCurrentPermission = jest.fn().mockResolvedValue({ permission: { endDate } })
    return {
      locale,
      cache: () => ({
        helpers: {
          transaction: {
            getCurrentPermission
          }
        }
      })
    }
  }

  it('reads the current permission and formats the expiry date', async () => {
    moment.mockClear()

    const format = jest.fn().mockReturnValue('3 February 2026')
    moment.mockReturnValueOnce({ format })
    const request = buildRequest('2026-02-03', 'cy')

    const data = await getData(request)

    expect(request.cache().helpers.transaction.getCurrentPermission).toHaveBeenCalledTimes(1)
    expect(moment).toHaveBeenCalledWith('2026-02-03', cacheDateFormat, 'cy')
    expect(format).toHaveBeenCalledWith(dateDisplayFormat)
    expect(data).toEqual({ licenceExpiry: '3 February 2026' })
  })
})
