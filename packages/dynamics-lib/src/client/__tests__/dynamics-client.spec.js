import { config } from '../dynamics-client.js'
import SimpleOAuth2 from 'simple-oauth2'

describe('dynamics-client', () => {
  it('is configured via environment variables', async () => {
    process.env.DYNAMICS_API_PATH = 'https://test-server/api/data/v9.1/'
    process.env.DYNAMICS_API_VERSION = '9.1'
    process.env.DYNAMICS_API_TIMEOUT = 60000
    process.env.OAUTH_AUTHORITY_HOST_URL = 'https://test-authority/'
    process.env.OAUTH_TENANT = 'tenant'
    process.env.OAUTH_CLIENT_ID = 'clientId'
    process.env.OAUTH_CLIENT_SECRET = 'clientSecret'
    process.env.OAUTH_RESOURCE = 'https://resource/.default'
    const dynamicsApiConfig = config()

    expect(dynamicsApiConfig).toMatchObject({
      serverUrl: 'https://test-server',
      dataApi: { version: process.env.DYNAMICS_API_VERSION },
      timeout: `${process.env.DYNAMICS_API_TIMEOUT}`,
      onTokenRefresh: expect.any(Function)
    })
    const token = await dynamicsApiConfig.onTokenRefresh()
    expect(token).toBe('MOCK TOKEN')
  })

  it('caches tokens until they expire', async () => {
    const dynamicsApiConfig = config()
    let token = await dynamicsApiConfig.onTokenRefresh()
    expect(token).toBe('MOCK TOKEN')
    SimpleOAuth2.__setMockTokenReturnValue('NEW MOCK TOKEN')
    token = await dynamicsApiConfig.onTokenRefresh()
    expect(token).toBe('MOCK TOKEN')
    SimpleOAuth2.__setMockTokenExpired(true)
    token = await dynamicsApiConfig.onTokenRefresh()
    expect(token).toBe('NEW MOCK TOKEN')
  })
})
