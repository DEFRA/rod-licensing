import { DynamoDB } from '@aws-sdk/client-dynamodb'
import AWS from 'aws-sdk'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import Config from '../config'

jest.mock('aws-sdk', () => {
  const SQS = jest.fn().mockImplementation(config => ({
    config: { ...config, apiVersion: '2012-11-05', region: config.region || 'eu-west-2' }
  }))
  const S3 = jest.fn().mockImplementation(config => ({
    config: { ...config, apiVersion: '2006-03-01', region: config.region || 'eu-west-2', s3ForcePathStyle: config.s3ForcePathStyle }
  }))
  const SecretsManager = jest.fn().mockImplementation(config => ({
    config: { ...config, apiVersion: '2017-10-17', region: config.region || 'eu-west-2' }
  }))

  return { SQS, S3, SecretsManager }
})

jest.mock('@aws-sdk/client-dynamodb')
jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocument: {
    from: jest.fn()
  }
}))

describe('AWS Connectors', () => {
  let SQS, S3, SecretsManager

  beforeEach(() => {
    DynamoDB.mockClear()
    DynamoDBDocument.from.mockClear()

    DynamoDBDocument.from.mockReturnValue({
      send: jest.fn(),
      queryAllPromise: jest.fn(),
      scanAllPromise: jest.fn(),
      batchWriteAllPromise: jest.fn(),
      createUpdateExpression: jest.fn()
    })

    SQS = AWS.SQS
    S3 = AWS.S3
    SecretsManager = AWS.SecretsManager

    SQS.mockClear()
    S3.mockClear()
    SecretsManager.mockClear()
  })

  it('configures dynamodb with a custom endpoint if one is defined in configuration', () => {
    const TEST_ENDPOINT = 'http://localhost:8080'
    Config.aws.dynamodb.endpoint = TEST_ENDPOINT
    require('../aws.js').default()
    expect(DynamoDB).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: TEST_ENDPOINT
      })
    )
    expect(DynamoDBDocument.from).toHaveBeenCalledWith(expect.any(DynamoDB))
  })

  it('uses the default dynamodb endpoint if it is not overridden in configuration', () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.dynamodb.endpoint
    require('../aws.js').default()
    expect(DynamoDB).toHaveBeenCalledWith(
      expect.objectContaining({
        region: 'eu-west-2'
      })
    )
    expect(DynamoDBDocument.from).toHaveBeenCalledWith(expect.any(DynamoDB))
  })

  it('configures sqs with a custom endpoint if one is defined in configuration', () => {
    const TEST_ENDPOINT = 'http://localhost:8080'
    Config.aws.sqs.endpoint = TEST_ENDPOINT
    require('../aws.js').default()
    expect(SQS).toHaveBeenCalledWith(
      expect.objectContaining({
        apiVersion: '2012-11-05',
        endpoint: TEST_ENDPOINT
      })
    )
  })

  it('uses the default sqs endpoint if it is not overridden in configuration', () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.sqs.endpoint
    require('../aws.js').default()
    expect(SQS).toHaveBeenCalledWith(
      expect.objectContaining({
        apiVersion: '2012-11-05'
      })
    )
  })

  it('configures s3 with a custom endpoint if one is defined in configuration', () => {
    const TEST_ENDPOINT = 'http://localhost:8080'
    Config.aws.s3.endpoint = TEST_ENDPOINT
    require('../aws.js').default()
    expect(S3).toHaveBeenCalledWith(
      expect.objectContaining({
        apiVersion: '2006-03-01',
        endpoint: TEST_ENDPOINT,
        s3ForcePathStyle: true
      })
    )
  })

  it('uses default s3 settings if a custom endpoint is not defined', () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.s3.endpoint
    require('../aws.js').default()
    expect(S3).toHaveBeenCalledWith(
      expect.objectContaining({
        apiVersion: '2006-03-01'
      })
    )
  })

  it('configures secretsmanager with a custom endpoint if one is defined in configuration', () => {
    const TEST_ENDPOINT = 'http://localhost:8080'
    Config.aws.secretsManager.endpoint = TEST_ENDPOINT
    require('../aws.js').default()
    expect(SecretsManager).toHaveBeenCalledWith(
      expect.objectContaining({
        apiVersion: '2017-10-17',
        endpoint: TEST_ENDPOINT
      })
    )
  })

  it('uses default secretsmanager settings if a custom endpoint is not defined', () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.secretsManager.endpoint
    require('../aws.js').default()
    expect(SecretsManager).toHaveBeenCalledWith(
      expect.objectContaining({
        apiVersion: '2017-10-17'
      })
    )
  })
})
