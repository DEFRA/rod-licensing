import config from './config.js'
import { createPartFiles } from './staging/create-part-files.js'
import { deliverFulfilmentFiles } from './staging/deliver-fulfilment-files.js'
import { DistributedLock } from '@defra-fish/connectors-lib'

/**
 * Lock for the ETL process.  Set for default 5 minute TTL unless explicitly released on completion.
 * @type {DistributedLock}
 */
const lock = new DistributedLock('fulfilment-etl', 5 * 60 * 1000)

/**
 * Process fulfilmnent requests.  Queries Dynamics for outstanding requests and the stages these into S3 (as part files) before they are finally
 * aggregated and sent to the sFTP endpoint
 *
 * @returns {Promise<void>}
 */
export const processFulfilment = async () => {
  await lock.obtainAndExecute({
    onLockObtained: async () => {
      await config.initialise()
      await createPartFiles()
      await deliverFulfilmentFiles()
    },
    maxWaitSeconds: 0
  })
}

const shutdown = async () => {
  await lock.release()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
