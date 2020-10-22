import config from './config.js'
import { createPartFiles } from './staging/create-part-files.js'
import { deliverFulfilmentFiles } from './staging/deliver-fulfilment-files.js'
import { DistributedLock, airbrake } from '@defra-fish/connectors-lib'
import { terminateCacheManager } from '@defra-fish/dynamics-lib'

/**
 * Lock for the ETL process.  Set for default 5 minute TTL unless explicitly released on completion.
 * @type {DistributedLock}
 */
const lock = new DistributedLock('fulfilment-etl', 5 * 60 * 1000)

/**
 * Process fulfilment requests.  Queries Dynamics for outstanding requests and the stages these into S3 (as part files) before they are finally
 * aggregated and sent to the sFTP endpoint
 *
 * @returns {Promise<void>}
 */
export const processFulfilment = async () => {
  airbrake.initialise()

  try {
    await lock.obtainAndExecute({
      onLockObtained: async () => {
        await config.initialise()
        await createPartFiles()
        await deliverFulfilmentFiles()
      },
      onLockError: async e => {
        console.log('Unable to obtain a lock for the fulfilment job, skipping execution.', e)
        process.exit(0)
      },
      maxWaitSeconds: 0
    })
  } finally {
    await terminateCacheManager()
    await airbrake.flush()
  }
}

const shutdown = async () => {
  await airbrake.flush()
  await lock.release()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
