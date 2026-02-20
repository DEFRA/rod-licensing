import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_CONFIRM, CANCEL_RP_IDENTIFY } from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import moment from 'moment-timezone'
import { dateDisplayFormat } from '../../../../../processors/date-and-time-display.js'
import '../route.js'

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_CONFIRM: { page: Symbol('cancel-rp-confirm-page'), uri: Symbol('cancel-rp-confirm-uri') },
  CANCEL_RP_IDENTIFY: { uri: Symbol('cancel-rp-identify-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')
jest.mock('moment-timezone')
jest.mock('../../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: Symbol('cache date format'),
  dateDisplayFormat: Symbol('date display format')
}))

const extractArgs = () => {
  const [[, , validator, completion, getData]] = pageRoute.mock.calls.filter(
    ([page, uri]) => page === CANCEL_RP_CONFIRM.page && uri === CANCEL_RP_CONFIRM.uri
  )
  return { validator, completion, getData }
}

describe('pageRoute receives expected arguments', () => {
  it('passes expected arguments to pageRoute', () => {
    expect(pageRoute).toHaveBeenCalledWith(CANCEL_RP_CONFIRM.page, CANCEL_RP_CONFIRM.uri, null, expect.any(Function), expect.any(Function))
  })
})

describe('completion function', () => {
  it('has name nextPage', () => {
    const { completion } = extractArgs()
    expect(completion.name).toBe('nextPage')
  })
})

describe('getData function', () => {
  moment.mockReturnValue({ format: jest.fn(() => '18th November, 2025') })

  const { getData } = extractArgs()

  const mockRequest = () => {
    const getCurrentPermission = jest.fn(() => ({ permission: { endDate: '2025-02-15' } }))

    return {
      locale: 'en',
      cache: () => ({
        helpers: {
          transaction: {
            getCurrentPermission
          }
        }
      })
    }
  }

  it('calls addLanguageCodeToUri with request object', async () => {
    const request = mockRequest()
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, expect.anything())
  })

  it('calls addLanguageCodeToUri with CANCEL_RP_IDENTIFY uri', async () => {
    const request = mockRequest()
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(expect.anything(), CANCEL_RP_IDENTIFY.uri)
  })

  it('cancelRpIdentify uri is equal to return of addLanguageCodeToUri for CANCEL_RP_IDENTIFY page', async () => {
    const expectedUri = Symbol('expected-cancel-rp-identify-uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedUri)

    const data = await getData(mockRequest())

    expect(data.uri).toEqual({
      cancelRpIdentify: expectedUri
    })
  })

  it('returns licenceExpiry in correct format', async () => {
    const mockFormat = jest.fn().mockReturnValue('19th November, 2025')
    moment.mockReturnValue({ format: mockFormat })

    const data = await getData(mockRequest())

    expect(data.licenceExpiry).toEqual('19th November, 2025')
  })

  it('uses expected date format', async () => {
    await getData(mockRequest())
    expect(moment.mock.results[0].value.format).toHaveBeenCalledWith(dateDisplayFormat)
  })
})
