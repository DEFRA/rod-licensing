'use strict'

/**
 * Reads the queue with the long poll and returns the { err, messages }
 */
import AWS from 'aws-sdk'
import db from 'debug'

const sqs = new AWS.SQS({ apiVersion: '2012-11-05' })

const debug = db('read-queue')
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
