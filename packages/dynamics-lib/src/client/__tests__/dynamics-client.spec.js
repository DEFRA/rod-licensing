describe('dynamics-client', () => {
  it('is configured via environment variables', async () => {
    process.env.DYNAMICS_API_PATH = 'https://test-server/api/data/v9.1/'
    process.env.DYNAMICS_API_VERSION = '9.1'
    process.env.DYNAMICS_API_TIMEOUT = 60000
    process.env.OAUTH_AUTHORITY_HOST_URL = 'https://test-authority/'
    process.env.OAUTH_TENANT = 'tenant'
    process.env.OAUTH_CLIENT_ID = 'clientId'
    process.env.OAUTH_CLIENT_SECRET = 'clientSecret'
    process.env.OAUTH_RESOURCE = 'https://resource/'

    const {
      default: { AuthenticationContext },
      mockAcquireTokenWithClientCredentials
    } = require('adal-node')
    const config = require('../dynamics-client.js').config()
    expect(config).toMatchObject({
      webApiUrl: process.env.DYNAMICS_API_PATH,
      webApiVersion: process.env.DYNAMICS_API_VERSION,
      timeout: `${process.env.DYNAMICS_API_TIMEOUT}`,
      onTokenRefresh: expect.any(Function)
    })
    const testCallback = jest.fn()
    await config.onTokenRefresh(testCallback)
    expect(testCallback).toHaveBeenCalled()
    expect(AuthenticationContext).toHaveBeenCalledWith(`${process.env.OAUTH_AUTHORITY_HOST_URL}${process.env.OAUTH_TENANT}`)
    expect(mockAcquireTokenWithClientCredentials).toHaveBeenCalledWith(
      process.env.OAUTH_RESOURCE,
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      expect.any(Function)
    )
  })
})
