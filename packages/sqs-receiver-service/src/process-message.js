'use strict'
import fetch from 'node-fetch'
import db from 'debug'
const debug = db('sqs:process-message')

/**
 * Posts what ever is in the body of the message to the subscriber. The message group id is added to the
 * subscriber url to allow the sent message to be directed to a specific endpoint
 *
 * @param {SQS.Message} message The message to be processed
 * @param {string} subscriber The subscriber URL
 * @param {number} subscriberTimeoutMs The time in milliseconds before the request to the subscriber will timeout
 * @returns {Promise<ProcessingResponse>}
 */
const processMessage = async (message, subscriber, subscriberTimeoutMs) => {
  const subscriberURL = message.Attributes.MessageGroupId
    ? new URL(`${subscriber}/${message.Attributes.MessageGroupId}`)
    : new URL(subscriber)

  try {
    debug('Sending message to %s: %O', subscriberURL.toString(), message)

    const response = await fetch(subscriberURL, {
      method: 'post',
      body: message.Body,
      headers: { 'Content-Type': 'application/json' },
      timeout: subscriberTimeoutMs
    })

    /**
     * @typedef {Object} ProcessingResponse
     * @property {!string} id The MessageId which generated this response
     * @property {!string} handle The ReceiptHandler of the message
     * @property {number} status The status-code returned by the subscriber
     * @property {string} [statusText] The status-text for the status-code
     * @property {string} message The message returned in the body of the response from the subscriber
     */
    const responseData = {
      id: message.MessageId,
      handle: message.ReceiptHandle,
      status: response.status,
      statusText: response.statusText,
      message: await response.text()
    }
    debug('Subscriber %s successfully processed message %s', subscriberURL.toString(), message.MessageId)

    if (!response.ok) {
      // If we have an error log it and continue. We will not remove the message
      console.error('Error from subscriber %s processing message %s: %O', subscriberURL.toString(), message.MessageId, responseData)
    }
    return responseData
  } catch (err) {
    console.error('Error sending message to subscriber %s: %O', subscriberURL.toString(), err)

    return {
      id: message.MessageId,
      handle: message.ReceiptHandle,
      status: 500,
      message: err.message
    }
  }
}

export default processMessage
