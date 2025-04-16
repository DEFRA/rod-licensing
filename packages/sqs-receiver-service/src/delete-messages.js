'use strict'
import { AWS } from '@defra-fish/connectors-lib'
import { DeleteMessageBatchCommand } from '@aws-sdk/client-sqs'

const { sqs } = AWS()
const MESSAGE_SUCCESS_STATUS_CODE = 200

export default async (queueUrl, messages) => {
  const messagesToDelete = messages.filter(m => m.status === MESSAGE_SUCCESS_STATUS_CODE)
  if (messagesToDelete.length) {
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
