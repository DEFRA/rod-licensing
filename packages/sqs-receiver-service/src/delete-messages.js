'use strict'
import db from 'debug'
import { AWS } from '@defra-fish/connectors-lib'
const { sqs } = AWS()

/**
 * This removes any messages from the queue that have been processed without error
 */
const debug = db('sqs:delete-messages')

const deleteMessages = async (url, messageSubscriberResults) => {
  try {
    const params = {
      QueueUrl: url,
      Entries: messageSubscriberResults
        .filter(msr => Math.floor(msr.status / 100) === 2)
        .map(msr => ({ Id: msr.id, ReceiptHandle: msr.handle }))
    }

    if (params.Entries.length) {
      const results = await sqs.deleteMessageBatch(params)

      if (results.Failed.length) {
        console.error('Failed to delete messages from %s: %o', url, results.Failed)
      }

      debug('Deleted %d messages from %s', results.Successful.length, url)
    }
  } catch (err) {
    console.error('Error deleting messages for %s: %o', url, err)
  }
}

export default deleteMessages
