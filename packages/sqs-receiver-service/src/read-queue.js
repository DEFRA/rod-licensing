'use strict'
import db from 'debug'
import AWS from './aws.js'
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
const readQueue = async (url, visibilityTimeoutMs, waitTimeMs) => {
  try {
    const params = {
      QueueUrl: url,
      AttributeNames: ['MessageGroupId'],
      MaxNumberOfMessages: 10,
      MessageAttributeNames: ['/*'],
      VisibilityTimeout: visibilityTimeoutMs / 1000,
      WaitTimeSeconds: waitTimeMs / 1000
    }

    const data = await sqs.receiveMessage(params).promise()

    debug({ messages: data.Messages })

    return data.Messages
  } catch (err) {
    /*
     * If we have an http error log it.
     * Any more general errors such as networking errors will terminate the process
     */
    console.error(`Error reading queue: ${url}`, err)

    if (!err.statusCode) {
      throw err
    } else {
      return []
    }
  }
}

export default readQueue
