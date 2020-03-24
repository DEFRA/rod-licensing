const TEST_ENDPOINT = 'http://localhost:8080'
describe('aws service', () => {
  it('configures sqs with a custom endpoint if one is defined in configuration', async () => {
    jest.unmock('aws-sdk')
    process.env.AWS_SQS_ENDPOINT = TEST_ENDPOINT
    const { sqs } = require('../aws.js').default()
    expect(sqs.config.endpoint).toEqual(TEST_ENDPOINT)
  })

  it('uses the default sqs endpoint if it is not overridden in configuration', async () => {
    jest.unmock('aws-sdk')
    process.env.AWS_REGION = 'eu-west-2'
    delete process.env.AWS_SQS_ENDPOINT
    const { sqs } = require('../aws.js').default()
    expect(sqs.config.endpoint).toEqual('sqs.eu-west-2.amazonaws.com')
  })
})
