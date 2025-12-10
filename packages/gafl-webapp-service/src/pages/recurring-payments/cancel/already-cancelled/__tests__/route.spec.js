import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_ALREADY_CANCELLED, CANCEL_RP_IDENTIFY } from '../../../../../uri.js'

require('../route.js')

// eslint-disable-next-line no-unused-vars
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

const getSampleRequest = () => ({
  cache: jest.fn(() => ({
    helpers: {
      page: {
        getCurrentPermission: jest.fn(() => ({ payload: { referenceNumber: 'RP0310', endDate: '2025:10:03:03:33:33' } }))
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

  it('passes getData to pageRoute', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        getData
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

  it('passes reference number from CANCEL_RP_IDENTIFY ', async () => {
    const referenceNumber = 'RP0310'
    expect(await getData(getSampleRequest(referenceNumber))).toEqual(
      expect.objectContaining({
        referenceNumber
      })
    )
  })

  it('transforms end date to display format', async () => {
    const endDate = '2025-10-03T03:33:33.000Z'
    const request = getSampleRequest()
    request.cache().helpers.page.getCurrentPermission.mockResolvedValueOnce({
      payload: { referenceNumber: 'RP0310', endDate }
    })
    const data = await getData(request)
    expect(data.endDate).toEqual('3 October 2025')
  })
})
