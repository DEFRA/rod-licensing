import pageRoute from '../../../../../routes/page-route.js'
import { RP_ALREADY_CANCELLED } from '../../../../../uri.js'

require('../route.js')
// eslint-disable-next-line no-unused-vars
const [[_v, _p, validator, completion, getData]] = pageRoute.mock.calls

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  RP_ALREADY_CANCELLED: { page: Symbol('cancel-rp-complete-page'), uri: Symbol('cancel-rp-complete-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')

describe('pageRoute receives expected arguments', () => {
  it('passes RP_ALREADY_CANCELLED.page as the view name', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        RP_ALREADY_CANCELLED.page,
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything()
      )
    })
  })

  it('passes RP_ALREADY_CANCELLED.uri as the path', () => {
    jest.isolateModules(() => {
      require('../route.js')
      expect(pageRoute).toHaveBeenCalledWith(
        expect.anything(),
        RP_ALREADY_CANCELLED.uri,
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
