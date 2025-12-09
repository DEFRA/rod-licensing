import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_ALREADY_CANCELLED, CANCEL_RP_IDENTIFY } from '../../../../../uri.js'

require('../route.js')

const [[_view, _path, _validator, _completion, getData]] = pageRoute.mock.calls

jest.mock('../../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_IDENTIFY: { page: Symbol('cancel-rp-identify-page') },
  CANCEL_RP_ALREADY_CANCELLED: {
    page: Symbol('cancel-rp-already-cancelled page'),
    uri: Symbol('cancel-rp-already-cancelled uri')
  }
}))
jest.mock('../../../../../processors/uri-helper.js')

const getSampleRequest = (referenceNumber = 'RP0310') => ({
  cache: jest.fn(() => ({
    helpers: {
      page: {
        getCurrentPermission: jest.fn(() => ({ payload: { referenceNumber } }))
      }
    }
  }))
})

describe('pageRoute receives expected arguments', () => {
  it('passes CANCEL_RP_ALREADY_CANCELLED.page as the view name', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        CANCEL_RP_ALREADY_CANCELLED.page,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })
  })

  it('passes CANCEL_RP_ALREADY_CANCELLED.uri as the path', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        CANCEL_RP_ALREADY_CANCELLED.uri,
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
  it('requests page data from CANCEL_RP_IDENTIFY page', async () => {
    const request = getSampleRequest()
    await getData(request)
    const [{ value: pageCache }] = request.cache.mock.results
    expect(pageCache.helpers.page.getCurrentPermission).toHaveBeenCalledWith(CANCEL_RP_IDENTIFY.page)
  })

  it('passes reference number from CANCEL_RP_IDENTIFY page data', async () => {
    const referenceNumber = 'RP0310'
    expect(await getData(getSampleRequest(referenceNumber))).toEqual(
      expect.objectContaining({
        referenceNumber
      })
    )
  })
})
