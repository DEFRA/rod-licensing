import { FILE_STAGE } from './constants.js'
import { getFileRecord, updateFileStagingTable } from '../io/db.js'
import { createTransactions } from './create-transactions.js'
import { finaliseTransactions } from './finalise-transactions.js'
import Path from 'path'
import md5File from 'md5-file'
import db from 'debug'
const debug = db('pocl:staging')

/**
 * Process the POCL file at the given path, staging all data into Dynamics via the Sales API
 *
 * @param xmlFilePath the path to the file to process
 * @returns {Promise<void>}
 */
export const stage = async xmlFilePath => {
  const filename = Path.basename(xmlFilePath)
  let fileRecord = await getFileRecord(filename)

  if (!fileRecord || fileRecord.stage === FILE_STAGE.Pending) {
    console.log('Import file %s not previously processed, processing now', filename)
    const md5 = await md5File(xmlFilePath)
    fileRecord = { ...fileRecord, ...{ filename, md5, stage: FILE_STAGE.Staging } }
    await updateFileStagingTable({ filename, md5, stage: FILE_STAGE.Staging })
  } else if (fileRecord.stage === FILE_STAGE.Completed) {
    console.log('Import file %s has already been staged, skipping', filename)
  } else {
    console.log('Resuming staging process for file %s', filename)
  }

  if (fileRecord.stage === FILE_STAGE.Staging) {
    debug('Staging records for file %s.', filename)
    const { succeeded, failed } = await createTransactions(xmlFilePath)
    await updateFileStagingTable({ filename, stage: FILE_STAGE.Finalising, stagingSucceeded: succeeded, stagingFailed: failed })
    fileRecord.stage = FILE_STAGE.Finalising
    debug('Finished staging records for file %s. Succeeded: %s, Failed: %s', filename, succeeded, failed)
  }

  if (fileRecord.stage === FILE_STAGE.Finalising) {
    debug('Finalising all staged transactions for file %s.', filename)
    const { succeeded, failed } = await finaliseTransactions(xmlFilePath)
    await updateFileStagingTable({ filename, stage: FILE_STAGE.Completed, finalisationSucceeded: succeeded, finalisationFailed: failed })
    debug('Finished finalising records for file %s. Succeeded: %s, Failed: %s', filename, succeeded, failed)
  }
}
