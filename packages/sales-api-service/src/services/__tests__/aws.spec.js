import Config from '../../config.js'
const TEST_ENDPOINT = 'http://localhost:8080'
describe('aws service', () => {
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
})
