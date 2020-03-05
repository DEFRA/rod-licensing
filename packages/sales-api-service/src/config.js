export default {
  aws: {
    region: process.env.AWS_REGION,
    sqs: {
      endpoint: process.env.AWS_SQS_ENDPOINT
    },
    dynamodb: {
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT
    }
  }
}
