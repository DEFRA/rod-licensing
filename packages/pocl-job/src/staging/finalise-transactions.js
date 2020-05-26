import { salesApi } from '@defra-fish/connectors-lib'
import Path from 'path'
import { MAX_BATCH_SIZE, RECORD_STAGE } from './constants.js'
import { getProcessedRecords, updateRecordStagingTable } from '../io/db.js'

/**
 * Finalise transactions in the Sales API for the provided post-office file
 *
 * @param xmlFilePath the full path to the file being processed
 * @returns {Promise<{failed: number, succeeded: number}>}
 */
export const finaliseTransactions = async xmlFilePath => {
  const filename = Path.basename(xmlFilePath)
  const state = await getInitialState(filename)
  for (let i = 0; i < state.remainingRecords.length; i += MAX_BATCH_SIZE) {
    state.buffer = state.remainingRecords.slice(i, i + MAX_BATCH_SIZE)
    await finaliseTransactionsInSalesApi(filename, state)
  }
  return { succeeded: state.succeeded, failed: state.failed }
}

/**
 * Get the inital state (supports resuming an interrupted process)
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
  const finalisationResults = await Promise.allSettled(
    state.buffer.map(r =>
      salesApi.finaliseTransaction(r.createTransactionId, { transactionFile: filename, ...r.finaliseTransactionPayload })
    )
  )
  state.buffer.forEach((record, idx) => {
    const result = finalisationResults[idx]
    if (result.status === 'fulfilled') {
      record.stage = RECORD_STAGE.TransactionFinalised
      delete record.finaliseTransactionPayload
      record.finaliseTransactionId = result.value.messageId
      state.succeeded++
    } else {
      record.stage = RECORD_STAGE.TransactionFinalisationFailed
      record.finaliseTransactionError = result.reason
      state.failed++
    }
  })
  await updateRecordStagingTable(filename, state.buffer)
  state.buffer = []
}
