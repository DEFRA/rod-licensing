import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_COMPLETE } from '../../../../../uri.js'
import moment from 'moment-timezone'
import { cacheDateFormat, dateDisplayFormat } from '../../../../../processors/date-and-time-display.js'
import '../route.js'

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_COMPLETE: { page: Symbol('cancel-rp-complete-page'), uri: Symbol('cancel-rp-complete-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')
jest.mock('moment-timezone', () => jest.fn(() => ({ format: () => {} })))
jest.mock('../../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: Symbol('cache-date-format'),
  dateDisplayFormat: Symbol('date-display-format')
}))

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
  const mockMessages = {
    rp_cancel_complete_contact_method_email: Symbol('email method'),
    rp_cancel_complete_contact_method_text: Symbol('text method'),
    rp_cancel_complete_contact_method_letter: Symbol('letter method')
  }

  const getMockRequest = ({
    locale = 'cy',
    endDate = '2026-02-03',
    preferredMethodOfConfirmation = 'Email',
    getCurrentPermission = jest.fn(() => ({
      permission: {
        endDate,
        licensee: {
          preferredMethodOfConfirmation
        }
      }
    }))
  } = {}) => ({
    locale,
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission
        }
      }
    }),
    i18n: {
      getCatalog: jest.fn(() => mockMessages)
    }
  })

  beforeEach(() => {
    moment.mockClear()
  })

  it('retrieves the current permission once', async () => {
    const getCurrentPermission = jest.fn(() => ({
      permission: { endDate: 'end date', licensee: { preferredMethodOfConfirmation: 'Email' } }
    }))
    const request = getMockRequest({ getCurrentPermission })

    await getData(request)

    expect(getCurrentPermission).toHaveBeenCalledTimes(1)
  })

  it('passes the cached end date and locale to moment', async () => {
    const locale = 'en'
    const endDate = '2026-02-27'

    await getData(getMockRequest({ locale, endDate }))

    expect(moment).toHaveBeenCalledWith(endDate, cacheDateFormat, locale)
  })

  it('formats the expiry using the shared display format', async () => {
    const format = jest.fn()
    moment.mockReturnValueOnce({ format })

    await getData(getMockRequest())

    expect(format).toHaveBeenCalledWith(dateDisplayFormat)
  })

  it('returns the formatted licence expiry', async () => {
    const formattedLicenceExpiry = Symbol('formatted date')
    const format = () => formattedLicenceExpiry
    moment.mockReturnValueOnce({ format })

    const data = await getData(getMockRequest())

    expect(data).toEqual(expect.objectContaining({ licenceExpiry: formattedLicenceExpiry }))
  })

  it('returns email method when preferredMethodOfConfirmation is Email', async () => {
    const data = await getData(getMockRequest({ preferredMethodOfConfirmation: 'Email' }))

    expect(data.preferredMethodOfContact).toBe(mockMessages.rp_cancel_complete_contact_method_email)
  })

  it('returns text message method when preferredMethodOfConfirmation is Text', async () => {
    const data = await getData(getMockRequest({ preferredMethodOfConfirmation: 'Text' }))

    expect(data.preferredMethodOfContact).toBe(mockMessages.rp_cancel_complete_contact_method_text)
  })

  it('returns letter method when preferredMethodOfConfirmation is Letter', async () => {
    const data = await getData(getMockRequest({ preferredMethodOfConfirmation: 'Letter' }))

    expect(data.preferredMethodOfContact).toBe(mockMessages.rp_cancel_complete_contact_method_letter)
  })

  it('defaults to letter method for unknown preference', async () => {
    const data = await getData(getMockRequest({ preferredMethodOfConfirmation: 'Prefer not to be contacted' }))

    expect(data.preferredMethodOfContact).toBe(mockMessages.rp_cancel_complete_contact_method_letter)
  })
})
