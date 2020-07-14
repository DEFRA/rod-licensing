export default {
  aws: {
    region: process.env.AWS_REGION,
    s3: {
      endpoint: process.env.AWS_S3_ENDPOINT
    },
    sqs: {
      endpoint: process.env.AWS_SQS_ENDPOINT
    },
    dynamodb: {
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT
    },
    secretsManager: {
      endpoint: process.env.AWS_SECRETS_MANAGER_ENDPOINT
    }
  }
}
