'use strict'
import { airbrake } from '@defra-fish/connectors-lib'
/**
 * Initializes and starts the receiver loop
 */
import receiver from './receiver.js'

let exitCode = 0

/**
 * Start the receiver
 */
;(async () => {
  airbrake.initialise()
  while (!exitCode) {
    try {
      await receiver()
    } catch (e) {
      console.error(e)
      exitCode = 1
    }
  }
  await airbrake.flush()
  process.exit(exitCode)
})()

const stopService = () => {
  exitCode = 0
}
process.on('SIGINT', stopService)
process.on('SIGTERM', stopService)
