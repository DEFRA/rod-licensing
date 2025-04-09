import Config from '../config.js'
import AWS from '../aws.js'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
import { createDocumentClient } from '../documentclient-decorator.js'

jest.mock('../documentclient-decorator.js')

describe('AWS Special cases', () => {
  it('document client passes convertEmptyValues flag', () => {
    let spiedOptions
    createDocumentClient.mockImplementation(options => {
      spiedOptions = options
      const client = new DynamoDB(options)
      return DynamoDBDocument.from(client)
    })
    AWS()
    expect(spiedOptions).toEqual(
      expect.objectContaining({
        convertEmptyValues: true
      })
    )
  })
})

describe.each`
  name                | clientName            | configName          | expectedAPIVersion
  ${'ddb'}            | ${'DynamoDB'}         | ${''}               | ${'2012-08-10'}
  ${'sqs'}            | ${'SQS'}              | ${''}               | ${'2012-11-05'}
  ${'s3'}             | ${'S3'}               | ${''}               | ${'2006-03-01'}
  ${'secretsManager'} | ${'SecretsManager'}   | ${'secretsManager'} | ${'2017-10-17'}
  ${'docClient'}      | ${'DynamoDBDocument'} | ${'dynamodb'}       | ${'2012-08-10'}
`('AWS connectors for $clientName', ({ name, clientName, configName, expectedAPIVersion }) => {
  beforeAll(() => {
    createDocumentClient.mockImplementation(options => {
      const client = new DynamoDB(options)
      return DynamoDBDocument.from(client)
    })
  })

  it(`exposes a ${clientName} client`, () => {
    const { [name]: client } = AWS()
    expect(client).toBeDefined()
  })

  it(`${name} client has type ${clientName}`, () => {
    const { [name]: client } = AWS()
    expect(client.constructor.name).toEqual(clientName)
  })

  it(`configures ${name} with a custom endpoint if one is defined in configuration`, async () => {
    Config.aws[configName || clientName.toLowerCase()].endpoint = 'http://localhost:8080'

    const { [name]: client } = AWS()
    const endpoint = await client.config.endpoint()

    expect(endpoint).toEqual(
      expect.objectContaining({
        hostname: 'localhost',
        port: 8080,
        protocol: 'http:',
        path: '/'
      })
    )
  })

  it(`leaves endpoint undefined for ${clientName}, reverting to the internal handling for the default endpoint if it is not set in config`, async () => {
    Config.aws[configName || clientName.toLowerCase()].endpoint = 'http://localhost:8080'

    const { [name]: client } = AWS()
    const endpoint = await client.config.endpoint()

    expect(endpoint).toEqual(
      expect.objectContaining({
        hostname: 'localhost',
        port: 8080,
        protocol: 'http:',
        path: '/'
      })
    )
  })

  it('uses expected apiVersion', () => {
    const { [name]: client } = AWS()
    expect(client.config.apiVersion).toEqual(expectedAPIVersion)
  })
})
