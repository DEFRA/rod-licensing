import AWS from 'aws-sdk'
import db from 'debug'

AWS.config.update({ region: process.env.AWS_DEFAULT_REGION })
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' })
/**
 * Returns a string containing current message statistics
 * @param url
 * @returns {Promise<void>}
 */

const debug = db('queue-stats')

let last = {
  ApproximateNumberOfMessagesDelayed: 0,
  ApproximateNumberOfMessagesNotVisible: 0,
  ApproximateNumberOfMessages: 0
}

const showQueueStatistics = async (url) => {
  try {
    const params = {
      QueueUrl: url,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
        'ApproximateNumberOfMessagesDelayed'
      ]
    }

    const { Attributes } = await sqs.getQueueAttributes(params).promise()
    const prt = attr => {
      const change = Number.parseInt(Attributes[attr]) - Number.parseInt(last[attr])
      if (change > 0) {
        return `${Number.parseInt(Attributes[attr])} (+${change})`
      } else {
        return `${Number.parseInt(Attributes[attr])} (${change})`
      }
    }

    const block = {
      Queue: url,
      ApproximateNumberOfMessagesDelayed: prt('ApproximateNumberOfMessagesDelayed'),
      ApproximateNumberOfMessagesNotVisible: prt('ApproximateNumberOfMessagesNotVisible'),
      ApproximateNumberOfMessages: prt('ApproximateNumberOfMessages')
    }

    debug({ stats: block })

    last = Attributes
  } catch (err) {
    console.error(err)
  }
}

export default showQueueStatistics
