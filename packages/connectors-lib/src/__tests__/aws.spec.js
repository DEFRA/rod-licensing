import Config from '../config.js'
const TEST_ENDPOINT = 'http://localhost:8080'
jest.dontMock('aws-sdk')
describe('aws connectors', () => {
  it('configures dynamodb with a custom endpoint if one is defined in configuration', async () => {
    Config.aws.dynamodb.endpoint = TEST_ENDPOINT
    const { ddb } = require('../aws.js').default()
    expect(ddb.config.endpoint).toEqual(TEST_ENDPOINT)
  })

  it('configures sqs with a custom endpoint if one is defined in configuration', async () => {
    Config.aws.sqs.endpoint = TEST_ENDPOINT
    const { sqs } = require('../aws.js').default()
    expect(sqs.config.endpoint).toEqual(TEST_ENDPOINT)
  })

  it('uses the default dynamodb endpoint if it is not overridden in configuration', async () => {
    process.env.AWS_REGION = 'eu-west-2'
    delete Config.aws.dynamodb.endpoint
    const { ddb } = require('../aws.js').default()
    expect(ddb.config.endpoint).toEqual('dynamodb.eu-west-2.amazonaws.com')
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
