import Config from '../config.js'
import AWS from 'aws-sdk'
const { DynamoDB, SQS } = AWS

export default function () {
  return {
    ddb: new DynamoDB({
      apiVersion: '2012-08-10',
      ...(Config.aws.dynamodb.endpoint && {
        endpoint: Config.aws.dynamodb.endpoint
      })
    }),
    docClient: new DynamoDB.DocumentClient({
      convertEmptyValues: true,
      apiVersion: '2012-08-10',
      ...(Config.aws.dynamodb.endpoint && {
        endpoint: Config.aws.dynamodb.endpoint
      })
    }),
    sqs: new SQS({
      apiVersion: '2012-11-05',
      ...(Config.aws.sqs.endpoint && {
        endpoint: Config.aws.sqs.endpoint
      })
    })
  }
}
