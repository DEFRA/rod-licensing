import Config from './config.js'
import AWS from 'aws-sdk'
const { DynamoDB, SQS, S3 } = AWS

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
    }),
    s3: new S3({
      apiVersion: '2006-03-01',
      ...(Config.aws.s3.endpoint && {
        endpoint: Config.aws.s3.endpoint,
        s3BucketEndpoint: false,
        s3ForcePathStyle: true
      })
    })
  }
}
