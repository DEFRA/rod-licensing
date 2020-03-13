import initialiseServer from '../../index.js'
let server = null

jest.mock('aws-sdk', () => ({
  DynamoDB: jest.fn().mockImplementation(() => ({
    listTables: jest.fn(() => ({
      promise: async () => ({ TableNames: ['TestTable'] })
    }))
  })),
  SQS: jest.fn().mockImplementation(() => ({
    listQueues: jest.fn(() => ({
      promise: async () => ({ QueueUrls: ['TestQueue'] })
    }))
  }))
}))

jest.mock('@defra-fish/dynamics-lib', () => ({
  dynamicsClient: {
    executeUnboundFunction: async fn => {
      return {
        '@odata.context': 'https://dynamics-host.crm4.dynamics.com/api/data/v9.1/$metadata#Microsoft.Dynamics.CRM.RetrieveVersionResponse',
        Version: '9.1.0.14134'
      }
    }
  }
}))

describe('hapi healthcheck', () => {
  beforeAll(async () => {
    server = await initialiseServer({ port: null })
  })

  afterAll(async () => {
    await server.stop()
  })

  it('exposes a simple status endpoint returning a 200 response when healthy', async () => {
    const result = await server.inject({ method: 'GET', url: '/service-status' })
    expect(result).toMatchObject({
      statusCode: 200,
      payload: 'GOOD'
    })
  })

  it('exposes a service status endpoint providing additional detailed information', async () => {
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
          message: expect.arrayContaining([
            expect.arrayContaining([expect.stringContaining('no feature tests have been defined')]),
            expect.arrayContaining([
              expect.objectContaining({
                connection: 'dynamics',
                status: 'ok'
              }),
              expect.objectContaining({
                connection: 'dynamodb',
                status: 'ok'
              }),
              expect.objectContaining({
                connection: 'sqs',
                status: 'ok'
              })
            ])
          ])
        },
        custom: expect.objectContaining({ health: expect.anything() })
      }
    })
  })

  it('exposes a service status page returning a 500 error when unhealthy', async () => {
    const { dynamicsClient } = require('@defra-fish/dynamics-lib')
    jest.spyOn(dynamicsClient, 'executeUnboundFunction').mockImplementation(async fn => {
      throw new Error('Simulated')
    })
    const result = await server.inject({ method: 'GET', url: '/service-status' })
    expect(result).toMatchObject({
      statusCode: 500,
      payload: 'BAD'
    })
  })
})
