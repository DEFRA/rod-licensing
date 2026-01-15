import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_ALREADY_CANCELLED, NEW_TRANSACTION } from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'

require('../route.js')

// eslint-disable-next-line no-unused-vars
const getData = pageRoute.mock.calls[0][4]

jest.mock('../../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_ALREADY_CANCELLED: {
    page: Symbol('cancel-rp-already-cancelled page'),
    uri: Symbol('cancel-rp-already-cancelled uri')
  }
}))
jest.mock('../../../../../processors/uri-helper.js')

const getSampleRequest = referenceNumber => ({
  cache: jest.fn(() => ({
    helpers: {
      page: {
        getCurrentPermission: jest.fn(() => ({ payload: { referenceNumber, endDate: '2025:10:03:03:33:33' } }))
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
        expect.any(Function)
      )
    })
  })
})

describe('getData', () => {
  it('returns reference number from payload', async () => {
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

  it('calls addLanguageCodeToUri with NEW_TRANSACTION.uri', async () => {
    const request = getSampleRequest()
    await getData(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, NEW_TRANSACTION.uri)
  })
})
