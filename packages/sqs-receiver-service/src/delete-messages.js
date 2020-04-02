'use strict'
import db from 'debug'
import AWS from './aws.js'
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
      const results = await sqs.deleteMessageBatch(params).promise()

      if (results.Failed.length) {
        console.error('Failed to delete from batch: %O', results.Failed)
      }

      debug({ success: results.Successful, failed: results.Failed })
    }
  } catch (err) {
    console.error('Error deleting messages for %s: %O', url, err)
  }
}

export default deleteMessages
