import cloneDeep from 'clone-deep'
export const configureAwsSdkMock = (AwsSdk = jest.genMockFromModule('aws-sdk')) => {
  const configuredMocks = []
  AwsSdk.__resetAll = () => configuredMocks.forEach(c => c.__init())

  const configureMock = (awsClass, methodNames, defaultResponse) => {
    configuredMocks.push(awsClass)
    awsClass.mockedMethods = createHandlers(awsClass, methodNames, defaultResponse)

    awsClass.mockImplementation(() => ({ ...awsClass.mockedMethods }))
    awsClass.expectedResponses = {}
    awsClass.nextResponses = {}
    awsClass.expectedErrors = {}
    awsClass.__init = (
      { expectedResponses = {}, nextResponses = [], expectedErrors = {} } = {
        expectedResponses: {},
        nextResponses: {},
        expectedErrors: {}
      }
    ) => {
      awsClass.expectedResponses = expectedResponses
      awsClass.nextResponses = nextResponses
      awsClass.expectedErrors = expectedErrors
    }
    awsClass.__setResponse = (methodName, response) => {
      awsClass.expectedResponses[methodName] = cloneDeep(response)
    }
    awsClass.__setNextResponses = (methodName, ...responses) => {
      awsClass.nextResponses[methodName] = cloneDeep(responses)
    }
    awsClass.__throwWithErrorOn = (methodName, error = new Error('Test error')) => {
      awsClass.expectedErrors[methodName] = error
    }
  }

  const createHandlers = (awsClass, names, defaultResponse) => {
    return names.reduce((acc, name) => {
      acc[name] = jest.fn(() => ({
        promise: jest.fn(async () => {
          if (awsClass.expectedErrors[name]) {
            throw awsClass.expectedErrors[name]
          }
          if (awsClass.nextResponses[name] && awsClass.nextResponses[name].length) {
            return awsClass.nextResponses[name].shift()
          }
          return awsClass.expectedResponses[name] || defaultResponse
        })
      }))
      return acc
    }, {})
  }

  configureMock(AwsSdk.SQS, [
    'listQueues',
    'createQueue',
    'deleteQueue',
    'purgeQueue',
    'sendMessage',
    'receiveMessage',
    'deleteMessage',
    'deleteMessageBatch'
  ])
  configureMock(AwsSdk.DynamoDB, ['listTables', 'describeTable', 'getItem', 'putItem', 'query', 'scan'], {})
  configureMock(
    AwsSdk.DynamoDB.DocumentClient,
    ['get', 'put', 'update', 'query', 'scan', 'delete', 'createSet', 'batchGet', 'batchWrite'],
    {}
  )
  configureMock(AwsSdk.S3, ['listObjectsV2', 'getObject', 'putObject', 'headObject', 'deleteObject', 'upload', 'listBuckets', 'headBucket'])
  configureMock(AwsSdk.SecretsManager, ['getSecretValue'])

  return AwsSdk
}
