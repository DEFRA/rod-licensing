import Config from './config.js'
import { createDocumentClient } from './documentclient-decorator.js'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { SQS } from '@aws-sdk/client-sqs'
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import { SecretsManager } from '@aws-sdk/client-secrets-manager'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'

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
    s3: new S3Client({
      region: 'eu-west-2',
      apiVersion: '2006-03-01',
      ...(Config.aws.s3.endpoint && {
        endpoint: Config.aws.s3.endpoint,
        forcePathStyle: true
      })
    }),
    secretsManager: new SecretsManager({
      apiVersion: '2017-10-17',
      ...(Config.aws.secretsManager.endpoint && {
        endpoint: Config.aws.secretsManager.endpoint
      })
    }),
    systemsManager: new SSMClient({
      apiVersion: '2014-11-06',
      region: 'eu-west-2',
      ...(Config.aws.systemsManager.endpoint && {
        endpoint: Config.aws.systemsManager.endpoint
      })
    }),
    ListObjectsV2Command,
    GetObjectCommand,
    GetParameterCommand
  }
}
