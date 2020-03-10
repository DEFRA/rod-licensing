'use strict'

import db from 'debug'
import environment from './environment.js'
import readQueue from './read-queue.js'
import processMessage from './process-message.js'
import deleteMessages from './delete-messages.js'
import showQueueStatistics from './show-queue-statistics.js'

/**
 * This is the process for a single SQS queue
 */
const debug = db('receiver')

// Validate the environment and return a standard object
const { env } = environment(process.env, process.env.RECEIVER_PREFIX)

console.log(`Running receiver process:${JSON.stringify(env, null, 4)}`)

/**
 * An infinite async loop to poll the queue
 * @returns {Promise<void>}
 */
const receiver = async () => {
  // Read the SQS message queue
  const messages = await readQueue(env.URL, Number.parseInt(env.VISIBILITY_TIMEOUT_MS), Number.parseInt(env.WAIT_TIME_MS))

  // If we have read any messages then post the body to the subscriber
  if (messages) {
    debug(`Read ${messages.length} messages...`)
    debug({ messages })

    const messageSubscriberResults = await Promise.all(
      messages.map(async m => processMessage(m, env.SUBSCRIBER, Number.parseInt(env.SUBSCRIBER_TIMEOUT_MS)))
    )

    debug({ messageSubscriberResults })
    await deleteMessages(env.URL, messageSubscriberResults)
  }

  if (process.env.debug) {
    await showQueueStatistics(env.URL)
  }

  // Invoke the poll delay only on a small number of messages processed
  // if they are coming in thick-and-fast then read again immediately
  if (!messages || messages.length < env.NO_DELAY_THRESHOLD) {
    debug(`Waiting ${env.POLLING_RATE_MS} milliseconds`)
    await new Promise(resolve => setTimeout(resolve, Number.parseInt(env.POLLING_RATE_MS)))
  }
}

export default receiver
