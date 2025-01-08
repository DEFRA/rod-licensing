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

const getMockDocClient = () => ({
  send: jest.fn(),
  queryAllPromise: jest.fn(),
  scanAllPromise: jest.fn(),
  batchWriteAllPromise: jest.fn(),
  createUpdateExpression: jest.fn()
})

describe('AWS Connectors', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('DynamoDB configuration with custom endpoint', () => {
    it('configures DynamoDBClient with the custom endpoint from the configuration', () => {
      const mockDocClient = getMockDocClient()
      createDocumentClient.mockReturnValue(mockDocClient)

      Config.aws.dynamodb.endpoint = TEST_ENDPOINT
      require('../aws.js').default()

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: TEST_ENDPOINT
        })
      )
    })

    it('uses the custom endpoint to create a mock document client', () => {
      const mockDocClient = getMockDocClient()
      createDocumentClient.mockReturnValue(mockDocClient)

      Config.aws.dynamodb.endpoint = TEST_ENDPOINT
      require('../aws.js').default()

      expect(createDocumentClient).toHaveBeenCalledWith(expect.any(DynamoDBClient))
    })

    it('assigns the mock document client to the returned AWS clients', () => {
      const mockDocClient = getMockDocClient()
      createDocumentClient.mockReturnValue(mockDocClient)

      Config.aws.dynamodb.endpoint = TEST_ENDPOINT
      const awsClients = require('../aws.js').default()

      expect(awsClients.docClient).toBe(mockDocClient)
    })

    it('sets the endpoint and convertEmptyValues when Config.aws.dynamodb.endpoint is defined', () => {
      const mockDocClient = getMockDocClient()
      createDocumentClient.mockReturnValue(mockDocClient)

      Config.aws.region = TEST_REGION
      Config.aws.dynamodb.endpoint = TEST_ENDPOINT
      require('../aws.js').default()

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: TEST_ENDPOINT,
          convertEmptyValues: true
        })
      )
    })
  })

  describe.each([{ region: 'eu-west-2' }, { region: 'us-east-1' }])('DynamoDB configuration with default region (%s)', ({ region }) => {
    it(`configures DynamoDBClient with the region ${region}`, () => {
      const mockDocClient = getMockDocClient()
      createDocumentClient.mockReturnValue(mockDocClient)

      Config.aws.region = region
      require('../aws.js').default()

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.objectContaining({
          region
        })
      )
    })

    it('uses the default endpoint when Config.aws.dynamodb.endpoint is not defined', () => {
      const mockDocClient = getMockDocClient()
      createDocumentClient.mockReturnValue(mockDocClient)

      delete Config.aws.dynamodb.endpoint
      require('../aws.js').default()

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.not.objectContaining({
          endpoint: expect.any(String)
        })
      )
    })

    it('does not set convertEmptyValues when Config.aws.dynamodb.endpoint is not defined', () => {
      const mockDocClient = getMockDocClient()
      createDocumentClient.mockReturnValue(mockDocClient)

      delete Config.aws.dynamodb.endpoint
      require('../aws.js').default()

      expect(DynamoDBClient).toHaveBeenCalledWith(
        expect.not.objectContaining({
          convertEmptyValues: true
        })
      )
    })
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
