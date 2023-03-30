const mockErrorRoutes = [Symbol('error')]
jest.mock('../error-routes.js', () => mockErrorRoutes)

const mockErrorTestingRoutes = [Symbol('error-testing')]
jest.mock('../error-test-routes.js', () => mockErrorTestingRoutes)

const mockTelesalesRoutes = [Symbol('telesales')]
jest.mock('../telesales-routes.js', () => mockTelesalesRoutes)

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
