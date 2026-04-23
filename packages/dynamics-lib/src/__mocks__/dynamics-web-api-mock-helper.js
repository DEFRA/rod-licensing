import Project from '../project.cjs'
const { readFileSync } = jest.requireActual('fs')
const Path = jest.requireActual('path')
const optionSetDataPath = Path.join(Project.root, 'src', '__mocks__', 'option-set-data.json')

export const configureDynamicsWebApiMock = (DynamicsWebApi) => {
  let expectedResponse = {}
  let nextResponses = {}
  let callError = {}
  let inBatchMode = false

  DynamicsWebApi.__reset = () => {
    expectedResponse = {}
    nextResponses = {}
    callError = {}
    inBatchMode = false
  }

  DynamicsWebApi.__setResponse = (methodName, value) => {
    expectedResponse[methodName] = value
  }
  DynamicsWebApi.__setNextResponses = (methodName, ...responses) => {
    nextResponses[methodName] = responses
  }

  DynamicsWebApi.__throwWithErrorOn = (methodName, error = new Error('Test error')) => {
    callError[methodName] = error
  }
  DynamicsWebApi.__throwWithErrorsOnBatchExecute = (...errors) => {
    // Batch calls may throw multiple exceptions
    errors = errors.length ? errors : [new Error('Test error')]
    callError.executeBatch = errors
  }

  const respond = methodName => {
    if (methodName === 'retrieveGlobalOptionSets' && !expectedResponse.retrieveGlobalOptionSets) {
      return JSON.parse(readFileSync(optionSetDataPath, { encoding: 'UTF-8' }))
    }
    if (nextResponses[methodName] && nextResponses[methodName].length) {
      return nextResponses[methodName].shift()
    }

    return expectedResponse[methodName]
  }

  const responseCapableMethod = async methodName => {
    if (callError && callError[methodName]) {
      throw callError[methodName]
    }

    if (!inBatchMode) {
      return respond(methodName)
    }
  }

  DynamicsWebApi.prototype.retrieve = DynamicsWebApi.retrieve = jest.fn(async () => responseCapableMethod('retrieve'))
  DynamicsWebApi.prototype.create = DynamicsWebApi.create = jest.fn(async () => responseCapableMethod('create'))
  DynamicsWebApi.prototype.update = DynamicsWebApi.update = jest.fn(async () => responseCapableMethod('update'))
  DynamicsWebApi.prototype.retrieveMultiple = DynamicsWebApi.retrieveMultiple = jest.fn(async () => responseCapableMethod('retrieveMultiple'))
  DynamicsWebApi.prototype.retrieveGlobalOptionSets = DynamicsWebApi.retrieveGlobalOptionSets = jest.fn(async () =>
    responseCapableMethod('retrieveGlobalOptionSets')
  )
  DynamicsWebApi.prototype.callFunction = DynamicsWebApi.callFunction = jest.fn(async functionName => {
    let returnValue = null
    if (functionName === 'RetrieveVersion') {
      returnValue = {
        '@odata.context': 'https://dynamics-host.crm4.dynamics.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.RetrieveVersionResponse',
        Version: '9.1.0.14134'
      }
    }
    return returnValue
  })

  DynamicsWebApi.prototype.startBatch = DynamicsWebApi.startBatch = jest.fn(() => {
    inBatchMode = true
  })
  DynamicsWebApi.prototype.executeBatch = DynamicsWebApi.executeBatch = jest.fn(async () => {
    inBatchMode = false
    return responseCapableMethod('executeBatch')
  })
  return DynamicsWebApi
}
