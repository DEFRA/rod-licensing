const AdalNode = jest.genMockFromModule('adal-node')
AdalNode.AuthenticationContext = jest.fn(() => ({
  acquireTokenWithClientCredentials: jest.fn(() => ({}))
}))

export default AdalNode
