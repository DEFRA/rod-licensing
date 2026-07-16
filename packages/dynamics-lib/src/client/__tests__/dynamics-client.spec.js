import { config } from '../dynamics-client.js'
import SimpleOAuth2 from 'simple-oauth2'

const MOCK_SCOPE = 'https://resource/.default'
const PREEMPTIVE_TOKEN_EXPIRY_SECONDS = 60

const setRequiredEnv = () => {
  process.env.DYNAMICS_API_PATH = 'https://test-server'
  process.env.DYNAMICS_API_VERSION = '9.1'
  process.env.DYNAMICS_API_TIMEOUT = 60000
  process.env.OAUTH_AUTHORITY_HOST_URL = 'https://test-authority/'
  process.env.OAUTH_TENANT = 'tenant'
  process.env.OAUTH_CLIENT_ID = 'clientId'
  process.env.OAUTH_CLIENT_SECRET = 'clientSecret'
  process.env.OAUTH_SCOPE = MOCK_SCOPE
}

const createConfiguredClient = () => {
  const dynamicsApiConfig = config()
  const oauthClient = SimpleOAuth2.ClientCredentials.mock.results.at(-1).value
  return { dynamicsApiConfig, oauthClient }
}

const seedCachedToken = async (dynamicsApiConfig, token = 'MOCK TOKEN') => {
  SimpleOAuth2.__setMockTokenReturnValue(token)
  await dynamicsApiConfig.onTokenRefresh()
}

describe('dynamics-client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    SimpleOAuth2.__setMockTokenReturnValue('MOCK TOKEN')
    SimpleOAuth2.__setMockTokenExpired(false)
    setRequiredEnv()
  })

  it('exposes serverUrl from DYNAMICS_API_PATH', () => {
    const { dynamicsApiConfig } = createConfiguredClient()

    expect(dynamicsApiConfig.serverUrl).toBe(process.env.DYNAMICS_API_PATH)
  })

  it('exposes dataApi.version from DYNAMICS_API_VERSION', () => {
    const { dynamicsApiConfig } = createConfiguredClient()

    expect(dynamicsApiConfig.dataApi.version).toBe(process.env.DYNAMICS_API_VERSION)
  })

  it('exposes timeout from DYNAMICS_API_TIMEOUT', () => {
    const { dynamicsApiConfig } = createConfiguredClient()

    expect(dynamicsApiConfig.timeout).toBe(`${process.env.DYNAMICS_API_TIMEOUT}`)
  })

  it('exposes onTokenRefresh as a function', () => {
    const { dynamicsApiConfig } = createConfiguredClient()

    expect(typeof dynamicsApiConfig.onTokenRefresh).toBe('function')
  })

  it('returns getToken access token when access token cache is empty', async () => {
    SimpleOAuth2.__setMockTokenReturnValue('FIRST TOKEN')
    const { dynamicsApiConfig } = createConfiguredClient()

    const token = await dynamicsApiConfig.onTokenRefresh()

    expect(token).toBe('FIRST TOKEN')
  })

  it('calls getToken once when access token cache is empty', async () => {
    const { dynamicsApiConfig, oauthClient } = createConfiguredClient()

    await dynamicsApiConfig.onTokenRefresh()

    expect(oauthClient.getToken).toHaveBeenCalledTimes(1)
  })

  it('calls getToken with scope when access token cache is empty', async () => {
    const { dynamicsApiConfig, oauthClient } = createConfiguredClient()

    await dynamicsApiConfig.onTokenRefresh()

    expect(oauthClient.getToken).toHaveBeenCalledWith({ scope: MOCK_SCOPE })
  })

  it('calls accessToken.expired with PREEMPTIVE_TOKEN_EXPIRY_SECONDS when token is cached', async () => {
    const { dynamicsApiConfig, oauthClient } = createConfiguredClient()
    await seedCachedToken(dynamicsApiConfig)
    const cachedAccessToken = await oauthClient.getToken.mock.results[0].value

    await dynamicsApiConfig.onTokenRefresh()

    expect(cachedAccessToken.expired).toHaveBeenCalledWith(PREEMPTIVE_TOKEN_EXPIRY_SECONDS)
  })

  it('returns cached token when cached access token is not expired', async () => {
    const { dynamicsApiConfig } = createConfiguredClient()
    await seedCachedToken(dynamicsApiConfig, 'FIRST TOKEN')
    SimpleOAuth2.__setMockTokenReturnValue('SECOND TOKEN')

    const token = await dynamicsApiConfig.onTokenRefresh()

    expect(token).toBe('FIRST TOKEN')
  })

  it('does not call getToken again when cached access token is not expired', async () => {
    const { dynamicsApiConfig, oauthClient } = createConfiguredClient()
    await seedCachedToken(dynamicsApiConfig)

    await dynamicsApiConfig.onTokenRefresh()

    expect(oauthClient.getToken).toHaveBeenCalledTimes(1)
  })

  it('returns refreshed token when cached access token is expired', async () => {
    const { dynamicsApiConfig } = createConfiguredClient()
    await seedCachedToken(dynamicsApiConfig, 'FIRST TOKEN')
    SimpleOAuth2.__setMockTokenReturnValue('NEW TOKEN')
    SimpleOAuth2.__setMockTokenExpired(true)

    const token = await dynamicsApiConfig.onTokenRefresh()

    expect(token).toBe('NEW TOKEN')
  })

  it('calls getToken again when cached access token is expired', async () => {
    const { dynamicsApiConfig, oauthClient } = createConfiguredClient()
    await seedCachedToken(dynamicsApiConfig)
    SimpleOAuth2.__setMockTokenExpired(true)

    await dynamicsApiConfig.onTokenRefresh()

    expect(oauthClient.getToken).toHaveBeenCalledTimes(2)
  })

  it('calls getToken with scope when cached access token is expired', async () => {
    const { dynamicsApiConfig, oauthClient } = createConfiguredClient()
    await seedCachedToken(dynamicsApiConfig)
    SimpleOAuth2.__setMockTokenExpired(true)

    await dynamicsApiConfig.onTokenRefresh()

    expect(oauthClient.getToken).toHaveBeenLastCalledWith({ scope: MOCK_SCOPE })
  })
})
