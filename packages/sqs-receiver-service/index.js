'use strict'
/**
 * Initializes and starts the receiver loop
 */
import receiver from './src/receiver.js'

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
