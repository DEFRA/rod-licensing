import { setupEnvironment } from '../../__mocks__/openid-client.js'

jest.mock('@defra-fish/connectors-lib')

let TestUtils = null
describe('Telesales route handlers', () => {
  // Start application before running the test case
  beforeAll(async () => {
    jest.isolateModules(() => {
      process.env.CHANNEL = 'telesales'
      setupEnvironment()
      TestUtils = require('../../__mocks__/test-utils-system.js')
      TestUtils.start(() => {})
    })
  })

  // Stop application after running the test case
  afterAll(async () => {
    TestUtils.stop(() => {})
  })

  it('redirects to the oidc endpoint when unauthenticated', async () => {
    const data = await TestUtils.server.inject({
      method: 'GET',
      url: '/'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('https://oauth-endpoint/token-endpoint')
  })

  it('exposes a route to redirect to when a user account is disabled', async () => {
    const data = await TestUtils.server.inject({
      method: 'GET',
      url: '/oidc/account-disabled'
    })
    expect(data.statusCode).toBe(200)
  })

  it('exposes a route to redirect to when a user does not have the correct role', async () => {
    const data = await TestUtils.server.inject({
      method: 'GET',
      url: '/oidc/role-required'
    })
    expect(data.statusCode).toBe(200)
  })
})

describe.only('cancellation route journey behaves as expected', () => {
  beforeEach(jest.clearAllMocks)

  it('adds the cancellation route journey if SHOW_CANCELLATION_JOURNEY is set to true', () => {
    process.env.SHOW_CANCELLATION_JOURNEY = 'true'
    jest.isolateModules(() => {
      const telesalesRoutes = require('../telesales-routes.js')
      expect(telesalesRoutes).toMatchSnapshot()
    })
  })

  it('omits the cancellation route journey if SHOW_CANCELLATION_JOURNEY is set to false', () => {
    process.env.SHOW_CANCELLATION_JOURNEY = 'false'
    jest.isolateModules(() => {
      const telesalesRoutes = require('../telesales-routes.js')
      expect(telesalesRoutes).toMatchSnapshot()
    })
  })

  it('omits the cancellation route journey if SHOW_CANCELLATION_JOURNEY is not present', () => {
    delete process.env.SHOW_CANCELLATION_JOURNEY
    jest.isolateModules(() => {
      const telesalesRoutes = require('../telesales-routes.js')
      expect(telesalesRoutes).toMatchSnapshot()
    })
  })
})
