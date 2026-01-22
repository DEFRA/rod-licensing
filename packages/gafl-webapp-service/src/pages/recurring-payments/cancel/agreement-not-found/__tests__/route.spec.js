import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_AGREEMENT_NOT_FOUND, CANCEL_RP_IDENTIFY } from '../../../../../uri.js'

require('../route.js')
// eslint-disable-next-line no-unused-vars
const [[_v, _p, validator, completion, getData]] = pageRoute.mock.calls

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_IDENTIFY: { page: Symbol('cancel-rp-identify-page') },
  CANCEL_RP_AGREEMENT_NOT_FOUND: { page: Symbol('cancel-rp-agreement-not-found-page'), uri: Symbol('cancel-rp-agreement-not-found-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')

const getSampleRequest = (referenceNumber = 'RP12345678') => ({
  cache: jest.fn(() => ({
    helpers: {
      page: {
        getCurrentPermission: jest.fn(() => ({ payload: { referenceNumber } }))
      }
    }
  }))
})

describe('pageRoute receives expected arguments', () => {
  it('passes CANCEL_RP_AGREEMENT_NOT_FOUND.page as the view name', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        CANCEL_RP_AGREEMENT_NOT_FOUND.page,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })
  })

  it('passes CANCEL_RP_AGREEMENT_NOT_FOUND.uri as the path', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        CANCEL_RP_AGREEMENT_NOT_FOUND.uri,
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
  it('passes call charges link in list of urls', async () => {
    expect(await getData(getSampleRequest())).toEqual(
      expect.objectContaining({
        links: expect.objectContaining({
          callCharges: 'https://www.gov.uk/call-charges'
        })
      })
    )
  })

  it('passes contact us email in list of urls', async () => {
    expect(await getData(getSampleRequest())).toEqual(
      expect.objectContaining({
        links: expect.objectContaining({
          contactUs: 'mailto:enquiries@environment-agency.gov.uk'
        })
      })
    )
  })

  it('requests page data from CANCEL_RP_IDENTIFY page', async () => {
    const request = getSampleRequest()
    await getData(request)
    const [{ value: pageCache }] = request.cache.mock.results
    expect(pageCache.helpers.page.getCurrentPermission).toHaveBeenCalledWith(CANCEL_RP_IDENTIFY.page)
  })

  it('passes reference number from CANCEL_RP_IDENTIFY page data', async () => {
    const referenceNumber = 'RP87654321'
    expect(await getData(getSampleRequest(referenceNumber))).toEqual(
      expect.objectContaining({
        referenceNumber
      })
    )
  })
})
