import { mockAuthenticationContext, mockAcquireTokenWithClientCredentials } from 'adal-node'
import { config, dynamicsClient } from '../dynamics-client.js'
import MockDynamicsWebApi from 'dynamics-web-api'

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
    const dynamicsApiConfig = config()

    expect(dynamicsApiConfig).toMatchObject({
      webApiUrl: process.env.DYNAMICS_API_PATH,
      webApiVersion: process.env.DYNAMICS_API_VERSION,
      timeout: `${process.env.DYNAMICS_API_TIMEOUT}`,
      onTokenRefresh: expect.any(Function)
    })
    const testCallback = jest.fn()
    await dynamicsApiConfig.onTokenRefresh(testCallback)
    expect(testCallback).toHaveBeenCalled()
    expect(mockAuthenticationContext).toHaveBeenCalledWith(`${process.env.OAUTH_AUTHORITY_HOST_URL}${process.env.OAUTH_TENANT}`)
    expect(mockAcquireTokenWithClientCredentials).toHaveBeenCalledWith(
      process.env.OAUTH_RESOURCE,
      process.env.OAUTH_CLIENT_ID,
      process.env.OAUTH_CLIENT_SECRET,
      expect.any(Function)
    )
  })

  it('exposes a custom method to retrieveAllPages with a callback', async () => {
    dynamicsClient.retrieveAllPages()
    MockDynamicsWebApi.__setResponse('retrieveMultipleRequest', [
      {
        value: [
          {
            '@odata.etag': 'EXAMPLE_CONTACT',
            contactid: 'f1bb733e-3b1e-ea11-a810-000d3a25c5d6',
            firstname: 'Fester',
            lastname: 'Tester',
            birthdate: '1946-01-01',
            emailaddress1: 'fester@tester.com'
          }
        ]
      }
    ])
  })
})
