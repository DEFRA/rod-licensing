import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_AUTHENTICATE, CANCEL_RP_IDENTIFY } from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'

require('../route.js')
// eslint-disable-next-line no-unused-vars
const [[_v, _p, validator, completion, getData]] = pageRoute.mock.calls

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_IDENTIFY: { page: Symbol('cancel-rp-identify'), uri: Symbol('cancel-rp-identify-uri') },
  CANCEL_RP_AUTHENTICATE: { uri: Symbol('cancel-rp-authenticate-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')

describe('pageRoute receives expected arguments', () => {
  it('passes CANCEL_RP_IDENTIFY.page as the view name', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        CANCEL_RP_IDENTIFY.page,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })
  })

  it('passes CANCEL_RP_IDENTIFY.uri as the path', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        CANCEL_RP_IDENTIFY.uri,
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

describe('completion function', () => {
  beforeEach(jest.clearAllMocks)

  it('calls addLanguageCodeToUri with request', () => {
    const sampleRequest = Symbol('sample request')
    completion(sampleRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, expect.anything())
  })

  it('calls addLanguageCodeToUri with CANCEL_RP_AUTHENTICATE uri', () => {
    completion({})
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(expect.anything(), CANCEL_RP_AUTHENTICATE.uri)
  })

  it('returns the value of addLanguageCodeToUri', () => {
    const expectedCompletionRedirect = Symbol('expected-completion-redirect')
    addLanguageCodeToUri.mockReturnValueOnce(expectedCompletionRedirect)

    const completionRedirect = completion({})

    expect(completionRedirect).toBe(expectedCompletionRedirect)
  })
})
