'use strict'
import { execute } from './processors/processor.js'
import { DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES, DEFAULT_SCAN_DURATION_HOURS } from './constants.js'
import { DistributedLock, airbrake } from '@defra-fish/connectors-lib'
import path from 'path'
import fs from 'fs'

const pkgPath = path.join(process.cwd(), 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

console.log('Payment mop up job starting at %s. name: %s. version: %s', new Date().toISOString(), pkg.name, pkg.version)

const incompletePurchaseAgeMinutes = Number(process.env.INCOMPLETE_PURCHASE_AGE_MINUTES || DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES)
const scanDurationHours = Number(process.env.SCAN_DURATION_HOURS || DEFAULT_SCAN_DURATION_HOURS)
const lock = new DistributedLock('payment-mop-up-etl', 5 * 60 * 1000)
airbrake.initialise()
lock
  .obtainAndExecute({
    onLockObtained: async () => {
      await execute(incompletePurchaseAgeMinutes, scanDurationHours)
    },
    onLockError: async e => {
      console.log('Unable to obtain a lock for the payment mop-up job, skipping execution.', e)
      process.exit(0)
    },
    maxWaitSeconds: 0
  })
  .catch(console.error)
  .finally(airbrake.flush)

const shutdown = async code => {
  await airbrake.flush()
  await lock.release()
  process.exit(code)
}

process.on('SIGINT', () => shutdown(130))
process.on('SIGTERM', () => shutdown(137))
