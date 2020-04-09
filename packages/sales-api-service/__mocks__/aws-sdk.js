const AwsSdk = jest.genMockFromModule('aws-sdk')

const configuredMocks = []
AwsSdk.__resetAll = () => configuredMocks.forEach(c => c.__init())

const configureMock = (awsClass, methodNames) => {
  configuredMocks.push(awsClass)
  awsClass.mockedMethods = createHandlers(awsClass, ...methodNames)

  awsClass.mockImplementation(() => ({ ...awsClass.mockedMethods }))
  awsClass.expectedResponses = {}
  awsClass.expectedErrors = {}
  awsClass.__init = ({ expectedResponses = {}, expectedErrors = {} } = { expectedResponses: {}, expectedErrors: {} }) => {
    awsClass.expectedResponses = expectedResponses
    awsClass.expectedErrors = expectedErrors
  }
  awsClass.__setResponse = (methodName, response) => {
    awsClass.expectedResponses[methodName] = response
  }
  awsClass.__throwWithErrorOn = (methodName, error = new Error('Test error')) => {
    awsClass.expectedErrors[methodName] = error
  }
}

const createHandlers = (awsClass, ...names) => {
  return names.reduce((acc, name) => {
    acc[name] = jest.fn(() => ({
      promise: jest.fn(async () => {
        if (awsClass.expectedErrors[name]) {
          throw awsClass.expectedErrors[name]
        }
        return awsClass.expectedResponses[name]
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
configureMock(AwsSdk.DynamoDB, ['listTables', 'describeTable', 'getItem', 'putItem', 'query', 'scan'])
configureMock(AwsSdk.DynamoDB.DocumentClient, ['get', 'put', 'update', 'query', 'scan', 'delete', 'createSet', 'batchGet', 'batchWrite'])

export default AwsSdk
