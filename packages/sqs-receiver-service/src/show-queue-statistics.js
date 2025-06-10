import db from 'debug'
import { AWS } from '@defra-fish/connectors-lib'
const { sqs } = AWS()
const debug = db('sqs:queue-stats')

let last = {
  ApproximateNumberOfMessagesDelayed: 0,
  ApproximateNumberOfMessagesNotVisible: 0,
  ApproximateNumberOfMessages: 0
}

/**
 * Prints a string containing current message statistics
 * @param {string} url the URL of the queue to print statistics for
 * @returns {Promise<void>}
 */
const showQueueStatistics = async url => {
  if (debug.enabled) {
    try {
      const params = {
        QueueUrl: url,
        AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible', 'ApproximateNumberOfMessagesDelayed']
      }

      const { Attributes } = await sqs.getQueueAttributes(params)
      const prt = attr => {
        const change = Number.parseInt(Attributes[attr]) - Number.parseInt(last[attr])
        if (change > 0) {
          return `${Number.parseInt(Attributes[attr])} (+${change})`
        } else {
          return `${Number.parseInt(Attributes[attr])} (${change})`
        }
      }

      debug('%o', {
        Queue: url,
        ApproximateNumberOfMessagesDelayed: prt('ApproximateNumberOfMessagesDelayed'),
        ApproximateNumberOfMessagesNotVisible: prt('ApproximateNumberOfMessagesNotVisible'),
        ApproximateNumberOfMessages: prt('ApproximateNumberOfMessages')
      })

      last = Attributes
    } catch (err) {
      console.error(err)
    }
  }
}

export default showQueueStatistics
