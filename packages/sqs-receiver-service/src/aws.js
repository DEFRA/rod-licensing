import AWS from 'aws-sdk'
const { SQS } = AWS

export default function () {
  return {
    sqs: new SQS({
      apiVersion: '2012-11-05',
      ...(process.env.AWS_SQS_ENDPOINT && { endpoint: process.env.AWS_SQS_ENDPOINT })
    })
  }
}
