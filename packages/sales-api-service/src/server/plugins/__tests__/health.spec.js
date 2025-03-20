import initialiseServer from '../../server.js'
import { dynamicsClient } from '@defra-fish/dynamics-lib'
import { AWS } from '@defra-fish/connectors-lib'

// import * as connectors from '@defra-fish/connectors-lib'
// console.log('Airbrake:', connectors.airbrake)

jest.mock('@defra-fish/connectors-lib', () => {
  const actual = jest.requireActual('@defra-fish/connectors-lib')

  const mockDocClient = {
    send: jest.fn()
  }

  const mockSqs = {
    SQS: {
      __init: jest.fn(config => {
        mockSqs.expectedResponses = config.expectedResponses
      })
    },
    listQueues: jest.fn(() => {
      return {
        promise: () => Promise.resolve(mockSqs.expectedResponses.listQueues)
      }
    }),
    sendMessage: jest.fn()
  }
  return {
    ...actual,
    AWS: jest.fn(() => ({
      docClient: mockDocClient,
      sqs: mockSqs
    }))
  }
})

const { docClient, sqs } = AWS.mock.results[0].value

let server = null
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
    sqs.SQS.__init({
      expectedResponses: {
        listQueues: { QueueUrls: ['TestQueue'] }
      }
    })

    docClient.send.mockResolvedValueOnce({ TableNames: ['TestTable'] })

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
                status: 'ok',
                TableNames: expect.arrayContaining(['TestTable'])
              }),
              expect.objectContaining({
                connection: 'sqs',
                status: 'ok',
                QueueUrls: expect.arrayContaining(['TestQueue'])
              })
            ])
          ])
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
