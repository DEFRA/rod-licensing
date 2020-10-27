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

const stopService = code => {
  exitCode = code
}
process.on('SIGINT', () => stopService(130))
process.on('SIGTERM', () => stopService(137))
