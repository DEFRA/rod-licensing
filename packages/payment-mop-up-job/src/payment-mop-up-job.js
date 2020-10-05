import { execute } from './processors/processor.js'
import { DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES, DEFAULT_SCAN_DURATION_HOURS } from './constants.js'
import { DistributedLock } from '@defra-fish/connectors-lib'

const incompletePurchaseAgeMinutes = Number(process.env.INCOMPLETE_PURCHASE_AGE_MINUTES || DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES)
const scanDurationHours = Number(process.env.SCAN_DURATION_HOURS || DEFAULT_SCAN_DURATION_HOURS)

const lock = new DistributedLock('payment-mop-up-etl', 5 * 60 * 1000)
lock
  .obtainAndExecute({
    onLockObtained: async () => {
      await execute(incompletePurchaseAgeMinutes, scanDurationHours)
    },
    maxWaitSeconds: 0
  })
  .catch(console.error)

const shutdown = async () => {
  await lock.release()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
