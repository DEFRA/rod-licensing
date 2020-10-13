import config from './config.js'
import { DistributedLock } from '@defra-fish/connectors-lib'
import { ftpToS3 } from './transport/ftp-to-s3.js'
import { s3ToLocal } from './transport/s3-to-local.js'
import { getFileRecords } from './io/db.js'
import { removeTemp } from './io/file.js'
import { stage } from './staging/pocl-data-staging.js'
import { FILE_STAGE } from './staging/constants.js'

import db from 'debug'
const debug = db('pocl:processor')
/**
 * Lock for the ETL process.  Set for default 5 minute TTL unless explicitly released on completion.
 * @type {DistributedLock}
 */
const lock = new DistributedLock('pocl-etl', 5 * 60 * 1000)

/**
 * Execute the POCL processor.  This will:
 *   - scan the target FTP server for files to import and stage these into S3
 *   - check S3 for files not yet imported or partially imported
 *   - stage any outstanding data into Dynamics via the Sales API
 *
 * @returns {Promise<void>}
 */
export async function execute () {
  await lock.obtainAndExecute({
    onLockObtained: async () => {
      try {
        await config.initialise()
        debug('Retrieving files from FTP')
        await ftpToS3()
        const pendingFileRecords = await getFileRecords(FILE_STAGE.Pending, FILE_STAGE.Staging, FILE_STAGE.Finalising)
        debug('Found %s files remaining to be processed', pendingFileRecords.length)
        const localXmlFiles = await Promise.all(pendingFileRecords.map(record => s3ToLocal(record.s3Key)))
        debug('Processing files: %o', localXmlFiles)
        await Promise.all(localXmlFiles.map(f => stage(f)))
      } finally {
        removeTemp()
      }
    },
    onLockError: async e => {
      console.log('Unable to obtain a lock for the pocl job, skipping execution.', e)
      process.exit(0)
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
