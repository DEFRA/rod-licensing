import Config from '../config.js'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'

// Mocking DynamoDB and DynamoDBDocument from AWS SDK v3
jest.mock('@aws-sdk/client-dynamodb')
jest.mock('@aws-sdk/lib-dynamodb')

// Mocking AWS SDK v2 components (SQS, S3, SecretsManager)
jest.mock('aws-sdk', () => {
  return {
    SQS: jest.fn(() => ({
      config: { endpoint: Config.aws.sqs.endpoint || 'sqs.eu-west-2.amazonaws.com' }
    })),
    S3: jest.fn(() => ({
      config: {
        endpoint: Config.aws.s3.endpoint || 's3.eu-west-2.amazonaws.com',
        s3ForcePathStyle: !!Config.aws.s3.endpoint
      }
    })),
    SecretsManager: jest.fn(() => ({
      config: { endpoint: Config.aws.secretsManager.endpoint || 'secretsmanager.eu-west-2.amazonaws.com' }
    }))
  }
})

const TEST_ENDPOINT = 'http://localhost:8080'

describe('aws connectors', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('configures dynamodb with a custom endpoint if one is defined in configuration', async () => {
    Config.aws.dynamodb.endpoint = TEST_ENDPOINT

    const dynamoDbMock = { config: { endpoint: TEST_ENDPOINT } }
    DynamoDB.mockReturnValue(dynamoDbMock)

    DynamoDBDocument.from.mockReturnValue({})

    // Remove unused `ddb` from destructuring
    require('../aws.js').default()

    expect(DynamoDB).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: TEST_ENDPOINT
      })
    )
    expect(DynamoDBDocument.from).toHaveBeenCalledWith(dynamoDbMock)
  })

  it('configures sqs with a custom endpoint if one is defined in configuration', async () => {
    Config.aws.sqs.endpoint = TEST_ENDPOINT
    const { sqs } = require('../aws.js').default()
    expect(sqs.config.endpoint).toEqual(TEST_ENDPOINT)
  })

  it('uses the default dynamodb endpoint if it is not overridden in configuration', async () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.dynamodb.endpoint

    const dynamoDbMock = { config: { endpoint: 'dynamodb.eu-west-2.amazonaws.com' } }
    DynamoDB.mockReturnValue(dynamoDbMock)

    DynamoDBDocument.from.mockReturnValue({})

    // Remove unused `ddb` from destructuring
    require('../aws.js').default()

    expect(DynamoDB).toHaveBeenCalledWith(
      expect.not.objectContaining({
        endpoint: expect.any(String)
      })
    )
    expect(DynamoDBDocument.from).toHaveBeenCalledWith(dynamoDbMock)
  })

  it('uses the default sqs endpoint if it is not overridden in configuration', async () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.sqs.endpoint
    const { sqs } = require('../aws.js').default()
    expect(sqs.config.endpoint).toEqual('sqs.eu-west-2.amazonaws.com')
  })

  it('configures s3 with a custom endpoint if one is defined in configuration', async () => {
    Config.aws.s3.endpoint = TEST_ENDPOINT
    const { s3 } = require('../aws.js').default()
    expect(s3.config.endpoint).toEqual(TEST_ENDPOINT)
    expect(s3.config.s3ForcePathStyle).toBeTruthy()
  })

  it('uses default s3 settings if a custom endpoint is not defined', async () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.s3.endpoint
    const { s3 } = require('../aws.js').default()
    expect(s3.config.endpoint).toEqual('s3.eu-west-2.amazonaws.com')
    expect(s3.config.s3ForcePathStyle).toBeFalsy()
  })

  it('configures secretsmanager with a custom endpoint if one is defined in configuration', async () => {
    Config.aws.secretsManager.endpoint = TEST_ENDPOINT
    const { secretsManager } = require('../aws.js').default()
    expect(secretsManager.config.endpoint).toEqual(TEST_ENDPOINT)
  })

  it('uses default secretsmanager settings if a custom endpoint is not defined', async () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.secretsManager.endpoint
    const { secretsManager } = require('../aws.js').default()
    expect(secretsManager.config.endpoint).toEqual('secretsmanager.eu-west-2.amazonaws.com')
  })
})
