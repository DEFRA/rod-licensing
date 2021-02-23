import { salesApi } from '@defra-fish/connectors-lib'
import Path from 'path'
import { MAX_FINALISE_TRANSACTION_BATCH_SIZE, RECORD_STAGE } from './constants.js'
import { getProcessedRecords, updateRecordStagingTable } from '../io/db.js'
import db from 'debug'
const debug = db('pocl:staging')

/**
 * Finalise transactions in the Sales API for the provided post-office file
 *
 * @param xmlFilePath the full path to the file being processed
 * @returns {Promise<{failed: number, succeeded: number}>}
 */
export const finaliseTransactions = async xmlFilePath => {
  const filename = Path.basename(xmlFilePath)
  const state = await getInitialState(filename)
  for (let i = 0; i < state.remainingRecords.length; i += MAX_FINALISE_TRANSACTION_BATCH_SIZE) {
    state.buffer = state.remainingRecords.slice(i, i + MAX_FINALISE_TRANSACTION_BATCH_SIZE)
    await finaliseTransactionsInSalesApi(filename, state)
  }
  return { succeeded: state.succeeded, failed: state.failed }
}

/**
 * Get the initial state (supports resuming an interrupted process)
 *
 * @typedef TransactionFinalisationState
 * @property {Array<Object>} buffer the current buffer being processed
 * @property {number} succeeded the number of records which were successfully finalised in the Sales Api
 * @property {number} failed the number of records which failed to be finalised in the Sales Api
 * @property {Array<Object>} remainingRecords records remaining to be processed
 *
 * @param filename the name of the file being processed (not including path)
 * @returns {Promise<TransactionFinalisationState>}
 */
const getInitialState = async filename => {
  const processedRecords = await getProcessedRecords(
    filename,
    RECORD_STAGE.TransactionCreated,
    RECORD_STAGE.TransactionFinalised,
    RECORD_STAGE.TransactionFinalisationFailed
  )
  return processedRecords.reduce(
    (acc, record) => {
      if (record.stage === RECORD_STAGE.TransactionCreated) {
        acc.remainingRecords.push(record)
      } else if (record.stage === RECORD_STAGE.TransactionFinalisationFailed) {
        acc.failed++
      } else {
        acc.succeeded++
      }
      return acc
    },
    { succeeded: 0, failed: 0, remainingRecords: [], buffer: [] }
  )
}

/**
 * Finalise the records in the Sales API, updating properties as appropriate based on whether the operation was successful or not
 *
 * @param {string} filename the name of the file being processed
 * @param {TransactionFinalisationState} state the current state of the process
 * @returns {Promise<*>}
 */
const finaliseTransactionsInSalesApi = async (filename, state) => {
  const transactionData = state.buffer.map(r => ({
    transactionId: r.createTransactionId,
    transactionFile: filename,
    ...r.finaliseTransactionPayload
  }))

  const finalisationResults = await Promise.allSettled(
    state.buffer.map(r =>
      salesApi.finaliseTransaction(r.createTransactionId, { transactionFile: filename, ...r.finaliseTransactionPayload })
    )
  )
  const succeeded = []
  const failed = []
  state.buffer.forEach((record, idx) => {
    const result = finalisationResults[idx]
    if (result.status === 'fulfilled') {
      succeeded.push({ record, response: result.value })
    } else if (result.reason.status === 410) {
      /*
        HTTP-410 errors indicate that the record has already been finalised.  This can occur if the process is terminated while finalising records
        (between the API call and the database update.) As the transaction has already been finalised, treat these as successful.  The data for the
        previously finalised record is returned under the data key of the error structure returned by the Sales API
       */
      succeeded.push({ record, response: result.reason.body.data })
    } else {
      failed.push({ record, reason: result.reason })
    }
  })

  await processSucceeded(filename, succeeded)
  await processFailed(filename, failed)

  state.succeeded += succeeded.length
  state.failed += failed.length
  state.buffer = []
}

/**
 * Update the status of records which were successfully finalised in the sales API
 *
 * @param {string} filename the name of the file being processed
 * @param {Array<Object>} succeeded An array of objects.  Each object shall contain a record key and a result key
 * @returns {Promise<void>}
 */
const processSucceeded = async (filename, succeeded) => {
  const recordUpdates = succeeded.map(({ record, response }) => {
    record.stage = RECORD_STAGE.TransactionFinalised
    delete record.createTransactionPayload
    delete record.finaliseTransactionPayload
    record.finaliseTransactionId = response.status.messageId
    debug('Successfully finalised transaction for record: %o', record)
    return record
  })
  await updateRecordStagingTable(filename, recordUpdates)
}

/**
 * Update the status of records which failed to be finalised in the sales API
 *
 * @param {string} filename the name of the file being processed
 * @param {Array<Object>} failed An array of objects.  Each object shall contain a record key and a result key
 * @returns {Promise<void>}
 */
const processFailed = async (filename, failed) => {
  // For record data errors, update the record status to be failed and insert a staging exception into Dynamics
  // 5xx system errors are dealt with by terminating the process (which will be resumed/replayed by the step function managing this process)
  const recordErrors = []
  const systemErrors = []
  failed.forEach(entry => (salesApi.isSystemError(entry.reason.status) ? systemErrors : recordErrors).push(entry))
  for (const { record, reason } of recordErrors) {
    record.stage = RECORD_STAGE.TransactionFinalisationFailed
    record.finaliseTransactionError = reason
    debug('Failed to finalise transaction for record: %o', record)
    await salesApi.createStagingException({
      transactionFileException: {
        name: `${filename}: FAILED-FINALISE-${record.id}`,
        description: JSON.stringify(reason, null, 2),
        json: JSON.stringify(record, null, 2),
        notes: 'Failed to finalise the transaction in the Sales API',
        type: 'Failure',
        transactionFile: filename
      }
    })
  }
  const recordUpdates = recordErrors.map(({ record }) => record)
  await updateRecordStagingTable(filename, recordUpdates)

  if (systemErrors.length) {
    // Throw an exception to terminate the process when encountering system errors.  The process will be resumed via the step function or can be
    // replayed later
    throw new Error(`System error(s) encountered while finalising records: ${JSON.stringify(systemErrors)}`)
  }
}
