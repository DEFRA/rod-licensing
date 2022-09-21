describe('route', () => {
  beforeEach(jest.clearAllMocks)

  process.env.CHANNEL = 'telesales'
  process.env.ERROR_PAGE_ROUTE = 'true'

  const routes = require('../routes.js')

  it('if channel environment variables are for telesales then telesales route is added to the routes array', async () => {
    expect(routes.default).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/oidc/role-required'
        })
      ])
    )
  })

  it('if ERROR_PAGE environment variable is true page error route is added to the routes array', async () => {
    expect(routes.default).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: '/buy/client-error'
        })
      ])
    )
  })
})
