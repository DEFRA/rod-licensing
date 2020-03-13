'use strict'
/**
 * Initializes and starts the receiver loop
 */
import receiver from './receiver.js'

/**
 * Start the receiver
 */
;(async () => {
  while (true) {
    try {
      await receiver()
    } catch (err) {
      console.error(err)
      break
    }
  }
})()
