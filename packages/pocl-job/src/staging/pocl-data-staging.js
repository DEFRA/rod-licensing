import { FILE_STAGE } from './constants.js'
import { updateFileStagingTable } from './db.js'
import { createTransactions } from './create-transactions.js'
import { finaliseTransactions } from './finalise-transactions.js'
import Path from 'path'
import md5File from 'md5-file'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('pocl:staging')
const { docClient } = AWS()

/**
 * Process the POCL file at the given path, staging all data into Dynamics via the Sales API
 *
 * @param xmlFilePath the path to the file to process
 * @returns {Promise<void>}
 */
export const stage = async xmlFilePath => {
  const filename = Path.basename(xmlFilePath)

  const result = await docClient.get({ TableName: process.env.POCL_FILE_STAGING_TABLE, Key: { filename }, ConsistentRead: true }).promise()
  let fileRecord = result.Item

  if (!fileRecord) {
    debug('Import file %s not previously processed, processing now', filename)
    const hash = await md5File(xmlFilePath)
    fileRecord = { filename, hash, stage: FILE_STAGE.Staging }
    await docClient.put({ TableName: process.env.POCL_FILE_STAGING_TABLE, Item: fileRecord }).promise()
  } else if (fileRecord.stage === FILE_STAGE.Completed) {
    console.log('Import file %s has already been staged, skipping', filename)
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
