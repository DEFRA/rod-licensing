import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_CONFIRM, CANCEL_RP_COMPLETE, CANCEL_RP_IDENTIFY } from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import moment from 'moment-timezone'

require('../route.js')

// eslint-disable-next-line no-unused-vars
const [[_v, _p, validator, completion, getData]] = pageRoute.mock.calls

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_CONFIRM: { page: Symbol('cancel-rp-confirm-page'), uri: Symbol('cancel-rp-confirm-uri') },
  CANCEL_RP_COMPLETE: { uri: Symbol('cancel-rp-complete-uri') },
  CANCEL_RP_IDENTIFY: { uri: Symbol('cancel-rp-identify-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')
jest.mock('moment-timezone')

describe('pageRoute receives expected arguments', () => {
  it('passes expected arguments to pageRoute', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        CANCEL_RP_CONFIRM.page,
        CANCEL_RP_CONFIRM.uri,
        expect.any(Function),
        expect.any(Function),
        expect.any(Function)
      )
    })
  })
})

describe('completion function', () => {
  beforeEach(jest.clearAllMocks)

  it('calls addLanguageCodeToUri with request object', () => {
    const sampleRequest = Symbol('sample request')
    completion(sampleRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, expect.anything())
  })

  it('calls addLanguageCodeToUri with CANCEL_RP_COMPLETE uri', () => {
    completion({})
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(expect.anything(), CANCEL_RP_COMPLETE.uri)
  })

  it('returns the value of addLanguageCodeToUri', () => {
    const expecetdUri = Symbol('cancel-rp-complete-uri')
    addLanguageCodeToUri.mockReturnValueOnce(expecetdUri)

    const completionRedirect = completion({})

    expect(completionRedirect).toBe(expecetdUri)
  })
})

describe('getData function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    moment.mockReturnValue({ format: jest.fn(() => '18th November, 2025') })
  })

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
})
