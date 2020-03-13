const DynamicsWebApi = jest.genMockFromModule('dynamics-web-api')

let expectedResponse = null
DynamicsWebApi.__setResponse = value => {
  expectedResponse = value
}
const responseCapableMethod = jest.fn(async () => expectedResponse)

DynamicsWebApi.prototype.createRequest = responseCapableMethod
DynamicsWebApi.prototype.updateRequest = responseCapableMethod
DynamicsWebApi.prototype.retrieveMultipleRequest = responseCapableMethod
DynamicsWebApi.prototype.startBatch = jest.fn(() => {})
DynamicsWebApi.prototype.executeBatch = responseCapableMethod

export default DynamicsWebApi
