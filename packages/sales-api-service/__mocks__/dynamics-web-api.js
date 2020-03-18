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
  const path = Path.join(Project.root, '..', 'dynamics-lib', '__mocks__', 'option-set-data.json')
  const data = JSON.parse(readFileSync(path, { encoding: 'UTF-8' }))
  return data
})
DynamicsWebApi.prototype.startBatch = jest.fn(() => {})
DynamicsWebApi.prototype.executeBatch = responseCapableMethod

export default DynamicsWebApi
