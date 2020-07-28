'use strict'

import db from 'debug'
import environment from './environment.js'
import readQueue from './read-queue.js'
import processMessage from './process-message.js'
import deleteMessages from './delete-messages.js'
import showQueueStatistics from './show-queue-statistics.js'
const debug = db('sqs:receiver')

// Validate the environment and return a standard object
const { env } = environment(process.env, process.env.RECEIVER_PREFIX)
console.log(`Running receiver process: ${JSON.stringify(env, null, 4)}`)
let messageLastReceived = Date.now()
let attemptsWithNoMessages = 0
/**
 * An infinite async loop to poll the queue
 * @returns {Promise<void>}
 */
const receiver = async () => {
  // Show queue statistics (if configured) on each iteration
  await showQueueStatistics(env.URL)

  // Read the SQS message queue
  const messages = await readQueue(env.URL, env.VISIBILITY_TIMEOUT_MS, env.WAIT_TIME_MS)

  // If we have read any messages then post the body to the subscriber
  if (messages.length) {
    const messageSubscriberResults = await Promise.all(
      messages.map(async m => processMessage(m, env.SUBSCRIBER, env.SUBSCRIBER_TIMEOUT_MS))
    )
    await deleteMessages(env.URL, messageSubscriberResults)
    messageLastReceived = Date.now()
    attemptsWithNoMessages = 0
  } else {
    attemptsWithNoMessages++
    /*
      Invoke the poll delay only if no messages were received from the queue and we've tried a number of times.  With SQS even if there are several
      hundred messages on the queue a receiveMessage request may return no messages (depending on which nodes were queried)
     */
    if (attemptsWithNoMessages >= env.ATTEMPTS_WITH_NO_DELAY) {
      const delay = Math.min(env.MAX_POLLING_INTERVAL_MS, Math.floor((0.5 * (Date.now() - messageLastReceived)) / 5000) * 5000)
      debug('Waiting %d milliseconds before polling again', delay)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

export default receiver
