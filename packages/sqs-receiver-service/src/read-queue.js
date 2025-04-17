'use strict'
import db from 'debug'
import { AWS } from '@defra-fish/connectors-lib'

const { sqs } = AWS()
const debug = db('sqs:read-queue')

/**
 * Reads the queue with the long polling operation
 *
 * @param {string} url the URL of the queue to read
 * @param {number} visibilityTimeoutMs the visibility timeout to use for messages that aren't successfully processed
 * @param {number} waitTimeMs the amount of time to wait for messages to become available
 * @returns {Promise<SQS.Message[]|*[]>}
 */
export default async (url, visibilityTimeoutMs, waitTimeMs) => {
  try {
    // const sqs = new SQS()
    const params = {
      QueueUrl: url,
      AttributeNames: ['MessageGroupId'],
      MaxNumberOfMessages: 10,
      MessageAttributeNames: ['/*'],
      VisibilityTimeout: visibilityTimeoutMs / 1000,
      WaitTimeSeconds: waitTimeMs / 1000
    }
    const data = await sqs.receiveMessage(params)
    const messages = data.Messages || []
    debug('Retrieved %d messages from %s', messages.length, url)
    return messages
  } catch (err) {
    /*
     * If we have an http error log it.
     * Any more general errors such as networking errors will terminate the process
     */
    console.error(`Error reading queue: ${url}`, err)

    if (!err.$metadata?.httpStatusCode) {
      throw err
    }
    return []
  }
}
