import Project from '../src/project.cjs'
import Path from 'path'
import { readFileSync } from 'fs'
const DynamicsWebApi = jest.genMockFromModule('dynamics-web-api')

let expectedResponse = null
DynamicsWebApi.__setResponse = value => {
  expectedResponse = value
}
const responseCapableMethod = jest.fn(async () => expectedResponse)

DynamicsWebApi.prototype.createRequest = responseCapableMethod
DynamicsWebApi.prototype.updateRequest = responseCapableMethod
DynamicsWebApi.prototype.retrieveMultipleRequest = responseCapableMethod
DynamicsWebApi.prototype.retrieveGlobalOptionSets = jest.fn(() => {
  const data = JSON.parse(readFileSync(Path.join(Project.root, '__mocks__', 'option-set-data.json'), { encoding: 'UTF-8' }))
  return data
})
DynamicsWebApi.prototype.startBatch = jest.fn(() => {})
DynamicsWebApi.prototype.executeBatch = responseCapableMethod

export default DynamicsWebApi
