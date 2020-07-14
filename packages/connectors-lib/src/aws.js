import Config from './config.js'
import { createDocumentClient } from './documentclient-decorator.js'
import AWS from 'aws-sdk'
const { DynamoDB, SQS, S3, SecretsManager } = AWS

export default function () {
  return {
    ddb: new DynamoDB({
      apiVersion: '2012-08-10',
      ...(Config.aws.dynamodb.endpoint && {
        endpoint: Config.aws.dynamodb.endpoint
      })
    }),
    docClient: createDocumentClient({
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
        s3ForcePathStyle: true
      })
    }),
    secretsManager: new SecretsManager({
      apiVersion: '2017-10-17',
      ...(Config.aws.secretsManager.endpoint && {
        endpoint: Config.aws.secretsManager.endpoint
      })
    })
  }
}
