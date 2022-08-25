import { setupEnvironment } from '../../__mocks__/openid-client.js'

let TestUtils = null

describe('Error route handlers', () => {
  beforeAll(async () => {
    jest.isolateModules(() => {
      process.env.ERROR_PAGE_ROUTE = 'true'
      setupEnvironment()
      TestUtils = require('../../__mocks__/test-utils-system.js')
      TestUtils.start(() => {})
    })
  })

  afterAll(async () => {
    TestUtils.stop(() => {})
  })

  it('redirects to the error page when error is thrown', async () => {
    const data = await TestUtils.server.inject({
      method: 'GET',
      url: '/buy/client-error'
    })
    expect(data.statusCode).toBe(302)
  })

  it('redirects to the error page when error is thrown', async () => {
    const data = await TestUtils.server.inject({
      method: 'GET',
      url: '/buy/server-error'
    })
    expect(data.statusCode).toBe(302)
  })
})
