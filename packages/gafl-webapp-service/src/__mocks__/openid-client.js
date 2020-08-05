export const mockSettings = {
  ENV: {
    OIDC_ENDPOINT: 'https://oauth-endpoint/',
    OIDC_REDIRECT_HOST: 'https://localhost:3143',
    OIDC_CLIENT_ID: 'client-id',
    OIDC_CLIENT_SECRET: 'client-secret',
    OIDC_SESSION_COOKIE_NAME: 'oidc-cookie-name',
    OIDC_SESSION_COOKIE_PASSWORD: 'open-sesame',
    OIDC_REQUIRE_DYNAMICS_ROLE: 'Telesales-role'
  },
  TEST_AUTH_ENDPOINT: 'https://oauth-endpoint/token-endpoint',
  TEST_AUTH_ISSUER: 'https://oauth-endpoint/issuer',
  TEST_NONCE: 'test_nonce',
  TEST_STATE: 'test_state',
  TEST_OID: 'test-azure-object-id',
  TEST_NAME: 'user fullname',
  TEST_EMAIL: 'user@example.com',
  TEST_EXP: 9999999999,
  TEST_POST_AUTH_REDIRECT: '/test/redirect'
}

const OpenIdClient = jest.genMockFromModule('openid-client')
OpenIdClient.Issuer = {
  discover: jest.fn(async () => ({
    issuer: mockSettings.TEST_AUTH_ISSUER,
    metadata: {},
    Client: mockOidcClientConstructor
  }))
}
OpenIdClient.generators.state = jest.fn(() => mockSettings.TEST_STATE)
OpenIdClient.generators.nonce = jest.fn(() => mockSettings.TEST_NONCE)

export const setupEnvironment = () => {
  Object.assign(process.env, mockSettings.ENV)
}

export const mockOidcClient = {
  authorizationUrl: jest.fn(() => mockSettings.TEST_AUTH_ENDPOINT),
  callback: jest.fn(() => ({
    claims: jest.fn(() => ({
      oid: mockSettings.TEST_OID,
      name: mockSettings.TEST_NAME,
      email: mockSettings.TEST_EMAIL,
      exp: mockSettings.TEST_EXP
    }))
  }))
}

export const mockOidcClientConstructor = jest.fn(() => mockOidcClient)

export const mockCache = {
  get: jest.fn(async () => {
    return {
      nonce: mockSettings.TEST_NONCE,
      state: mockSettings.TEST_STATE,
      postAuthRedirect: mockSettings.TEST_POST_AUTH_REDIRECT
    }
  }),
  set: jest.fn(),
  clear: jest.fn()
}
export const mockServer = {
  cache: jest.fn(() => mockCache),
  auth: {
    strategy: jest.fn(),
    default: jest.fn()
  }
}

export default OpenIdClient
