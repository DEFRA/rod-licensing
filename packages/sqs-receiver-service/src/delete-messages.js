'use strict'
import { AWS } from '@defra-fish/connectors-lib'
import { DeleteMessageBatchCommand } from '@aws-sdk/client-sqs'

const { sqs } = AWS()

export default async (queueUrl, messages) => {
  const messagesToDelete = messages.filter(m => m.status === 200)
  if (messagesToDelete.length) {
    // const sqs = new SQS()
    const command = new DeleteMessageBatchCommand({
      QueueUrl: queueUrl,
      Entries: messagesToDelete.map(m => ({
        Id: m.id,
        ReceiptHandle: m.handle
      }))
    })
    await sqs.send(command)
  }
}
