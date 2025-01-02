import Config from '../config.js'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { createDocumentClient } from '../documentclient-decorator.js'
const TEST_ENDPOINT = 'http://localhost:8080'
const TEST_REGION = 'eu-west-2'

jest.dontMock('aws-sdk')

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn()
}))

jest.mock('../documentclient-decorator.js', () => ({
  createDocumentClient: jest.fn()
}))

describe('AWS Connectors', () => {
  let mockDocClient
  beforeEach(() => {
    jest.resetAllMocks()

    mockDocClient = {
      send: jest.fn(),
      queryAllPromise: jest.fn(),
      scanAllPromise: jest.fn(),
      batchWriteAllPromise: jest.fn(),
      createUpdateExpression: jest.fn()
    }
    createDocumentClient.mockReturnValue(mockDocClient)
  })

  it('configures dynamodb with a custom endpoint if one is defined in configuration', () => {
    Config.aws.dynamodb.endpoint = TEST_ENDPOINT
    const awsClients = require('../aws.js').default()
    expect(DynamoDBClient).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: TEST_ENDPOINT
      })
    )
    expect(createDocumentClient).toHaveBeenCalledWith(expect.any(DynamoDBClient))
    expect(awsClients.docClient).toBe(mockDocClient)
  })

  it('uses the default dynamodb endpoint if it is not overridden in configuration', () => {
    process.env.AWS_REGION = TEST_REGION
    Config.aws.region = TEST_REGION
    const awsClients = require('../aws.js').default()
    expect(DynamoDBClient).toHaveBeenCalledWith(
      expect.objectContaining({
        region: TEST_REGION
      })
    )
    expect(createDocumentClient).toHaveBeenCalledWith(expect.any(DynamoDBClient))
    expect(awsClients.docClient).toBe(mockDocClient)
  })

  it('configures sqs with a custom endpoint if one is defined in configuration', async () => {
    Config.aws.sqs.endpoint = TEST_ENDPOINT
    const { sqs } = require('../aws.js').default()
    expect(sqs.config.endpoint).toEqual(TEST_ENDPOINT)
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
