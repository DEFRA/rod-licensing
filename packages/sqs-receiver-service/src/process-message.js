'use strict'

/**
 * Posts what ever is in the body of the message to the subscriber. The message group id is added to the
 * subscriber url to allow the sent message to be directed to a specific endpoint
 */
import fetch from 'node-fetch'
import db from 'debug'
const debug = db('process-message')

const processMessage = async (message, subscriber, subscriberTimeoutMs) => {
  const subscriberURL = message.Attributes.MessageGroupId
    ? new URL(`${subscriber}/${message.Attributes.MessageGroupId}`)
    : new URL(subscriber)

  try {
    debug(`Processing message ${message.MessageId} from ${subscriberURL}`)

    const response = await fetch(subscriberURL, {
      method: 'post',
      body: message.Body,
      headers: { 'Content-Type': 'application/json' },
      timeout: subscriberTimeoutMs
    })

    const result = await response.json()

    debug({ result })

    // If we have an error log it and continue. We will not remove the message
    if (!response.ok) {
      console.error(`Error from subscriber: ${subscriberURL.toString()}`)
      console.error({ result })

      return {
        id: message.MessageId,
        handle: message.ReceiptHandle,
        status: result.statusCode,
        error: result.error,
        message: result.message
      }
    }

    return {
      id: message.MessageId,
      handle: message.ReceiptHandle,
      status: 200
    }
  } catch (err) {
    console.error(`Error from subscriber: ${subscriberURL.toString()}`)
    console.error(err)

    return {
      id: message.MessageId,
      handle: message.ReceiptHandle,
      status: 500,
      message: err.message || 'Unknown error'
    }
  }
}

export default processMessage
