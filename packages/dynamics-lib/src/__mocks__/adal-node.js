const AdalNode = jest.genMockFromModule('adal-node')

export const mockAcquireTokenWithClientCredentials = jest.fn(async (resource, clientId, clientSecret, callback) => {
  callback(null, {})
})
export const mockAuthenticationContext = jest.fn(authorityUrl => ({
  acquireTokenWithClientCredentials: mockAcquireTokenWithClientCredentials
}))

AdalNode.AuthenticationContext = mockAuthenticationContext

export default AdalNode
