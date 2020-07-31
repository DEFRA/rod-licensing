import { salesApi } from '@defra-fish/connectors-lib'
import Path from 'path'
import { MAX_CREATE_TRANSACTION_BATCH_SIZE, RECORD_STAGE } from './constants.js'
import { transform } from '../transform/pocl-transform-stream.js'
import { getProcessedRecords, updateRecordStagingTable } from '../io/db.js'
import db from 'debug'
const debug = db('pocl:staging')

/**
 * Create the transactions in the Sales API by proessing the file at the given path
 *
 * @param xmlFilePath the full file path to the POCL XML file
 * @returns {Promise<{failed: number, succeeded: number}>}
 */
export const createTransactions = async xmlFilePath => {
  const filename = Path.basename(xmlFilePath)
  const state = await getInitialState(filename)

  await transform(xmlFilePath, async function * (source) {
    for await (const data of source) {
      if (!state.processedIds.has(data.id)) {
        state.processedIds.add(data.id)
        state.buffer.push(data)
        if (state.buffer.length === MAX_CREATE_TRANSACTION_BATCH_SIZE) {
          await createTransactionsInSalesApi(filename, state)
        }
      }
    }
  })
  // Process any remaining content of the buffer
  await createTransactionsInSalesApi(filename, state)
  return { succeeded: state.succeeded, failed: state.failed }
}

/**
 * Get the inital state (supports resuming an interrupted process)
 *
 * @typedef TransactionCreationState
 * @property {Array<Object>} buffer the current buffer being processed
 * @property {number} succeeded the number of records which were successfully created in the Sales Api
 * @property {number} failed the number of records which failed to be created in the Sales Api
 * @property {Set<string>} processedIds the ID's of records that were successfully processed
 *
 * @param filename the name of the file being processed (not including path)
 * @returns {Promise<TransactionCreationState>}
 */
const getInitialState = async filename => {
  const processedRecords = await getProcessedRecords(filename)
  processedRecords.length && debug('File partially processed, resuming from record %s', processedRecords.length)
  return processedRecords.reduce(
    (acc, record) => {
      if (record.stage === RECORD_STAGE.TransactionCreationFailed) {
        acc.failed++
      } else {
        acc.succeeded++
      }
      acc.processedIds.add(record.id)
      return acc
    },
    { buffer: [], succeeded: 0, failed: 0, processedIds: new Set() }
  )
}

/**
 * Create the given records in the Sales API, updating properties as appropriate based on whether the record was successfully created or not
 *
 * @param {string} filename the name of the file being processed
 * @param {TransactionCreationState} state the current state of the process
 * @returns {Promise<void>}
 */
const createTransactionsInSalesApi = async (filename, state) => {
  if (state.buffer.length) {
    const createResults = await salesApi.createTransactions(state.buffer.map(item => item.createTransactionPayload))
    for (let idx = 0; idx < state.buffer.length; idx++) {
      const record = state.buffer[idx]
      const apiResponse = createResults[idx]
      if (apiResponse.statusCode === 201) {
        record.stage = RECORD_STAGE.TransactionCreated
        record.createTransactionId = apiResponse.response.id
        state.succeeded++
      } else {
        record.stage = RECORD_STAGE.TransactionCreationFailed
        record.createTransactionError = apiResponse
        state.failed++
        debug('Failed to create transaction for record: %o', record)
        await salesApi.createStagingException({
          transactionFileException: {
            name: `${filename}: FAILED-CREATE-${record.id}`,
            description: JSON.stringify(apiResponse, null, 2),
            json: JSON.stringify(record, null, 2),
            notes: 'Failed to create the transaction in the Sales API',
            type: 'Failure',
            transactionFile: filename
          }
        })
      }
    }
    await updateRecordStagingTable(filename, state.buffer)
    state.buffer = []
  }
}
