const AdalNode = jest.genMockFromModule('adal-node')

export const mockAcquireTokenWithClientCredentials = jest.fn(async (resource, clientId, clientSecret, callback) => {
  callback(null, {})
})
export const mockAuthenticationContext = jest.fn(authorityUrl => ({
  acquireTokenWithClientCredentials: mockAcquireTokenWithClientCredentials
}))

AdalNode.AuthenticationContext = mockAuthenticationContext

export const mockLoggingOptions = jest.fn()
AdalNode.Logging = {
  setLoggingOptions: mockLoggingOptions,
  LOGGING_LEVEL: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    VERBOSE: 3
  }
}

export default AdalNode
