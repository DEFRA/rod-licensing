import { initialise, signIn } from '../oidc-handler.js'
import OpenIdClient from 'openid-client'
import { salesApi } from '@defra-fish/connectors-lib'
import {
  setupEnvironment,
  mockSettings,
  mockOidcClient,
  mockCache,
  mockServer,
  mockOidcClientConstructor
} from '../../__mocks__/openid-client.js'

jest.mock('@defra-fish/connectors-lib')

describe('oidc handler', () => {
  beforeAll(setupEnvironment)

  describe('initialise', () => {
    it('initialises authentication on the hapi server', async () => {
      await expect(initialise(mockServer)).resolves.toBeUndefined()
      expect(OpenIdClient.Issuer.discover).toHaveBeenCalledWith(mockSettings.ENV.OIDC_ENDPOINT)
      expect(mockOidcClientConstructor).toHaveBeenCalledWith({
        client_id: mockSettings.ENV.OIDC_CLIENT_ID,
        client_secret: mockSettings.ENV.OIDC_CLIENT_SECRET,
        redirect_uris: [`${mockSettings.ENV.OIDC_REDIRECT_HOST}/oidc/signin`],
        response_types: ['code', 'id_token']
      })
      expect(mockServer.cache).toHaveBeenCalledWith({ expiresIn: 43200000, segment: 'oidc' })
      expect(mockServer.auth.default).toHaveBeenCalledWith('oidc')
      expect(mockServer.auth.strategy).toHaveBeenCalledWith('oidc', 'cookie', {
        cookie: {
          name: mockSettings.ENV.OIDC_SESSION_COOKIE_NAME,
          password: mockSettings.ENV.OIDC_SESSION_COOKIE_PASSWORD,
          ttl: null,
          isSecure: process.env.NODE_ENV !== 'development',
          isHttpOnly: process.env.NODE_ENV !== 'development',
          isSameSite: 'Lax',
          path: '/'
        },
        redirectTo: expect.any(Function),
        validateFunc: expect.any(Function)
      })
      const redirectHandler = mockServer.auth.strategy.mock.calls[0][2].redirectTo
      const validationHandler = mockServer.auth.strategy.mock.calls[0][2].validateFunc
      expect(redirectHandler({ path: '/original/path', cookieAuth: { clear: jest.fn() } })).toEqual(mockSettings.TEST_AUTH_ENDPOINT)
      expect(mockOidcClient.authorizationUrl).toHaveBeenCalledWith({
        response_mode: 'form_post',
        response_type: 'code id_token',
        scope: 'openid profile email',
        state: mockSettings.TEST_STATE,
        nonce: mockSettings.TEST_NONCE,
        domain_hint: 'defra.gov.uk'
      })

      await expect(validationHandler({}, {})).resolves.toEqual({ valid: false })
      await expect(validationHandler({}, { oid: mockSettings.TEST_OID })).resolves.toEqual({
        valid: true,
        credentials: { oid: mockSettings.TEST_OID }
      })
    })
  })

  describe('signIn', () => {
    beforeEach(async () => {
      await expect(initialise(mockServer)).resolves.toBeUndefined()
    })

    it('redirects to the page requested prior to authentication on success', async () => {
      const fakeRequest = {
        payload: {
          id_token: 'sample_token',
          state: mockSettings.TEST_STATE
        },
        cookieAuth: {
          set: jest.fn(),
          ttl: jest.fn()
        }
      }
      const fakeHandler = { redirectWithLanguageCode: jest.fn() }

      salesApi.getSystemUser.mockResolvedValue({
        id: '26449770-5e67-e911-a988-000d3ab9df39',
        oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
        firstName: 'Sam',
        lastName: 'Gardner-Dell',
        isDisabled: false,
        roles: [
          {
            id: 'cf333fee-79b8-e611-80e7-c4346bac7e3c',
            name: mockSettings.ENV.OIDC_REQUIRE_DYNAMICS_ROLE
          }
        ]
      })

      await expect(signIn(fakeRequest, fakeHandler)).resolves.toBeUndefined()
      expect(fakeRequest.cookieAuth.set).toHaveBeenCalledWith({
        oid: mockSettings.TEST_OID,
        name: mockSettings.TEST_NAME,
        email: mockSettings.TEST_EMAIL
      })
      expect(fakeRequest.cookieAuth.ttl).toHaveBeenCalledWith(expect.any(Number))
      expect(fakeHandler.redirectWithLanguageCode).toHaveBeenCalledWith(mockSettings.TEST_POST_AUTH_REDIRECT)
    })

    it('redirects to /oidc/role-required if the user does not have the required role set in Dynamics', async () => {
      const fakeRequest = {
        payload: { id_token: 'sample_token', state: mockSettings.TEST_STATE },
        cookieAuth: { set: jest.fn(), ttl: jest.fn() }
      }
      const fakeHandler = { redirectWithLanguageCode: jest.fn() }

      salesApi.getSystemUser.mockResolvedValue({
        id: '26449770-5e67-e911-a988-000d3ab9df39',
        oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
        firstName: 'Sam',
        lastName: 'Gardner-Dell',
        isDisabled: false,
        roles: [
          {
            id: 'cf333fee-79b8-e611-80e7-c4346bac7e3c',
            name: 'Not the correct role'
          }
        ]
      })

      await expect(signIn(fakeRequest, fakeHandler)).resolves.toBeUndefined()
      expect(fakeRequest.cookieAuth.set).not.toHaveBeenCalled()
      expect(fakeRequest.cookieAuth.ttl).not.toHaveBeenCalled()
      expect(fakeHandler.redirectWithLanguageCode).toHaveBeenCalledWith('/oidc/role-required')
    })

    it('redirects to /oidc/account-disabled if the user account is not recognised in Dynamics', async () => {
      const fakeRequest = {
        payload: { id_token: 'sample_token', state: 'test_stored_state' },
        cookieAuth: { set: jest.fn(), ttl: jest.fn() }
      }
      const fakeHandler = { redirectWithLanguageCode: jest.fn() }
      salesApi.getSystemUser.mockResolvedValue(null)
      await expect(signIn(fakeRequest, fakeHandler)).resolves.toBeUndefined()
      expect(fakeRequest.cookieAuth.set).not.toHaveBeenCalled()
      expect(fakeRequest.cookieAuth.ttl).not.toHaveBeenCalled()
      expect(fakeHandler.redirectWithLanguageCode).toHaveBeenCalledWith('/oidc/account-disabled')
    })

    it('redirects to /oidc/account-disabled if the user account has been set to disabled in Dynamics', async () => {
      const fakeRequest = {
        payload: { id_token: 'sample_token', state: 'test_stored_state' },
        cookieAuth: { set: jest.fn(), ttl: jest.fn() }
      }
      const fakeHandler = { redirectWithLanguageCode: jest.fn() }

      salesApi.getSystemUser.mockResolvedValue({
        id: '26449770-5e67-e911-a988-000d3ab9df39',
        oid: 'e4661642-0a25-4d49-b7bd-8178699e0161',
        firstName: 'Sam',
        lastName: 'Gardner-Dell',
        isDisabled: true,
        roles: [
          {
            id: 'cf333fee-79b8-e611-80e7-c4346bac7e3c',
            name: 'Fish CRM - Telesales'
          }
        ]
      })

      await expect(signIn(fakeRequest, fakeHandler)).resolves.toBeUndefined()
      expect(fakeRequest.cookieAuth.set).not.toHaveBeenCalled()
      expect(fakeRequest.cookieAuth.ttl).not.toHaveBeenCalled()
      expect(fakeHandler.redirectWithLanguageCode).toHaveBeenCalledWith('/oidc/account-disabled')
    })

    it('throws errors authenticating the token back up the stack', async () => {
      mockOidcClient.callback.mockRejectedValue(new Error('error validating jwt token'))
      mockCache.get.mockResolvedValue(null)
      const fakeRequest = { payload: { id_token: 'sample_token', state: mockSettings.TEST_STATE } }
      const fakeHandler = { redirectWithLanguageCode: jest.fn() }
      await expect(signIn(fakeRequest, fakeHandler)).rejects.toThrow('error validating jwt token')
    })

    it('throws a 500 error if the payload does not contain an id_token', async () => {
      const fakeRequest = { payload: { error: 'ERROR_CODE', error_description: 'Something went wrong' } }
      const fakeHandler = { redirectWithLanguageCode: jest.fn() }
      await expect(signIn(fakeRequest, fakeHandler)).rejects.toThrow('Authentication error: ERROR_CODE: Something went wrong')
    })
  })
})
