import {
  CANCEL_RP_IDENTIFY,
  CANCEL_RP_DETAILS,
  CANCEL_RP_CONFIRM,
  CANCEL_RP_COMPLETE,
  CANCEL_RP_AGREEMENT_NOT_FOUND,
  CANCEL_RP_LICENCE_NOT_FOUND,
  CANCEL_RP_ALREADY_CANCELLED
} from '../../uri.js'

const mockErrorRoutes = [Symbol('error')]
jest.mock('../error-routes.js', () => mockErrorRoutes)

const mockErrorTestingRoutes = [Symbol('error-testing')]
jest.mock('../error-test-routes.js', () => mockErrorTestingRoutes)

const mockTelesalesRoutes = [Symbol('telesales')]
jest.mock('../telesales-routes.js', () => mockTelesalesRoutes)

jest.mock('@defra-fish/connectors-lib')
const getCancelRPURIs = () => [
  CANCEL_RP_IDENTIFY.uri,
  CANCEL_RP_DETAILS.uri,
  CANCEL_RP_CONFIRM.uri,
  CANCEL_RP_COMPLETE.uri,
  CANCEL_RP_AGREEMENT_NOT_FOUND.uri,
  CANCEL_RP_LICENCE_NOT_FOUND.uri,
  CANCEL_RP_ALREADY_CANCELLED.uri
]

describe('route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
  })

  it('if CHANNEL environment variables are for telesales then telesales route is added to the routes array', async () => {
    process.env.CHANNEL = 'telesales'
    const routes = require('../routes.js')
    expect(routes.default).toEqual(expect.arrayContaining(mockTelesalesRoutes))
  })

  it('if ERROR_PAGE environment variable is true page error route is added to the routes array', async () => {
    process.env.ERROR_PAGE_ROUTE = 'true'
    const routes = require('../routes.js')
    expect(routes.default).toEqual(expect.arrayContaining(mockErrorRoutes))
  })

  it('if ERROR_PAGE environment variable is true error testing route is added to the routes array', async () => {
    process.env.ERROR_PAGE_ROUTE = 'true'
    const routes = require('../routes.js')
    expect(routes.default).toEqual(expect.arrayContaining(mockErrorTestingRoutes))
  })

  it('if channel environment variables are not for telesales then telesales route is not added to the routes array', async () => {
    process.env.CHANNEL = 'not_telesales'
    const routes = require('../routes.js')
    expect(routes.default).toEqual(expect.not.arrayContaining(mockTelesalesRoutes))
  })

  it('if ERROR_PAGE environment variable is false page error route is not added to the routes array', async () => {
    process.env.ERROR_PAGE_ROUTE = 'false'
    const routes = require('../routes.js')
    expect(routes.default).toEqual(expect.not.arrayContaining(mockErrorRoutes))
  })

  it('if ERROR_PAGE environment variable is false error testing route is not added to the routes array', async () => {
    process.env.ERROR_PAGE_ROUTE = 'false'
    const routes = require('../routes.js')
    expect(routes.default).toEqual(expect.not.arrayContaining(mockErrorTestingRoutes))
  })
})

describe('cancellation route journey behaves as expected', () => {
  beforeEach(jest.clearAllMocks)

  it('adds the cancellation route journey if SHOW_CANCELLATION_JOURNEY is set to true', () => {
    process.env.SHOW_CANCELLATION_JOURNEY = 'true'
    jest.isolateModules(() => {
      const routesPaths = require('../routes.js').default.map(route => route.path)
      expect(routesPaths).toEqual(expect.arrayContaining(getCancelRPURIs()))
    })
  })

  it('omits the cancellation route journey if SHOW_CANCELLATION_JOURNEY is set to false', () => {
    process.env.SHOW_CANCELLATION_JOURNEY = 'false'
    jest.isolateModules(() => {
      const routes = require('../routes.js').default
      const cancelRPURIs = getCancelRPURIs()
      const cancelRPRoutes = routes.filter(route => cancelRPURIs.includes(route.path))
      expect(cancelRPRoutes).toHaveLength(0)
    })
  })

  it('omits the cancellation route journey if SHOW_CANCELLATION_JOURNEY is not present', () => {
    delete process.env.SHOW_CANCELLATION_JOURNEY
    jest.isolateModules(() => {
      const routes = require('../routes.js').default
      const cancelRPURIs = getCancelRPURIs()
      const cancelRPRoutes = routes.filter(route => cancelRPURIs.includes(route.path))
      expect(cancelRPRoutes).toHaveLength(0)
    })
  })
})
