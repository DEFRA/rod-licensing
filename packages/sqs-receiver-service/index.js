'use strict'
/**
 * Initializes and starts the receiver loop
 */
import receiver from './src/receiver.js'

// The receiver prefix determines the set of environment variables used
if (!process.env.RECEIVER_PREFIX) {
  console.error('Set environment variable RECEIVER_PREFIX')
  process.exit(9)
}

/**
 * Start the receiver
 */
;(async () => {
  while (true) {
    try {
      await receiver()
    } catch (err) {
      console.log(err)
      break
    }
  }
})()
