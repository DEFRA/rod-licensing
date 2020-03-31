const AdalNode = jest.genMockFromModule('adal-node')

export const mockAcquireTokenWithClientCredentials = jest.fn(async (resource, clientId, clientSecret, callback) => {
  callback(null, {})
})

AdalNode.AuthenticationContext = jest.fn(authorityUrl => ({
  acquireTokenWithClientCredentials: mockAcquireTokenWithClientCredentials
}))

export default AdalNode
