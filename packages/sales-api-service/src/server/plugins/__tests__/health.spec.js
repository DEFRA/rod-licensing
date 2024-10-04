import initialiseServer from '../../server.js'
import { dynamicsClient } from '@defra-fish/dynamics-lib'
import { SQS, S3, SecretsManager } from 'aws-sdk'
import { DynamoDBClient, ListTablesCommand } from '@aws-sdk/client-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'

let server = null
const ddbMock = mockClient(DynamoDBClient)

jest.mock('aws-sdk', () => {
  const SQS = jest.fn(() => ({
    listQueues: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ QueueUrls: ['TestQueue'] })
    })
  }))
  
  const S3 = jest.fn(() => ({
    listBuckets: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ Buckets: [{ Name: 'TestBucket' }] })
    })
  }))

  const SecretsManager = jest.fn(() => ({
    getSecretValue: jest.fn().mockReturnValue({
      promise: jest.fn().mockResolvedValue({ SecretString: JSON.stringify({ secretKey: 'secretValue' }) })
    })
  }))

  return { SQS, S3, SecretsManager }
})

describe('hapi healthcheck', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
    ddbMock.reset()
  })

  it('exposes a simple status endpoint returning a 200 response when healthy', async () => {
    const result = await server.inject({ method: 'GET', url: '/service-status' })
    expect(result).toMatchObject({
      statusCode: 200,
      payload: 'GOOD'
    })
  })

  it('exposes a service status endpoint providing additional detailed information', async () => {
    // v2 responses
    const sqs = new SQS()
    sqs.listQueues.mockResolvedValue({ QueueUrls: ['TestQueue'] })

    const s3 = new S3()
    s3.listBuckets.mockResolvedValue({ Buckets: [{ Name: 'TestBucket' }] })

    const secretsManager = new SecretsManager()
    secretsManager.getSecretValue.mockResolvedValue({ SecretString: JSON.stringify({ secretKey: 'secretValue' }) })

    // v3 response
    ddbMock.on(ListTablesCommand).resolves({ TableNames: ['TestTable'] })

    const result = await server.inject({
      method: 'GET',
      url: '/service-status?v&h'
    })

    expect(result).toMatchObject({ statusCode: 200 })
    const payload = JSON.parse(result.payload)
    expect(payload).toMatchObject({
      service: {
        id: expect.any(String),
        name: expect.any(String),
        env: expect.any(String),
        schema: expect.any(String),
        version: expect.any(String),
        status: {
          state: 'GOOD',
          message: [
            ["no feature tests have been defined"],
            [
              {
                "@odata.context": expect.any(String),
                Version: expect.any(String),
                connection: "dynamics",
                status: "ok"
              },
              {
                TableNames: ["TestTable"],
                connection: "dynamodb",
                status: "ok"
              },
              {
                QueueUrls: ["TestQueue"],
                connection: "sqs",
                status: "ok"
              }
            ]
          ]
        },
        custom: expect.objectContaining({ health: expect.anything() })
      }
    })
  })

  it('exposes a service status page returning a 500 error when unhealthy', async () => {
    jest.spyOn(dynamicsClient, 'executeUnboundFunction').mockImplementation(async () => {
      throw new Error('Simulated')
    })
    const result = await server.inject({ method: 'GET', url: '/service-status' })
    expect(result).toMatchObject({
      statusCode: 500,
      payload: 'BAD'
    })
  })
})
