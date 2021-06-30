import { persist, StagingException, PoclStagingException, PoclValidationError } from '@defra-fish/dynamics-lib'
import db from 'debug'
import { getGlobalOptionSetValue } from '../reference-data.service.js'
const debug = db('sales:exceptions')

/**
 * Create a new staging exception
 *
 * @typedef {Object} ExceptionData
 * @property {!string} stagingId the staging identifier associated with the exception
 * @property {!string} description the description of the exception that occurred
 * @property {!string} transactionJson the transaction JSON data which caused the exception to occur
 * @property {!string} exceptionJson the exception JSON data for diagnosis purposes
 *
 * @param {ExceptionData} exceptionData the data with which to create the staging exception
 * @returns {Promise<StagingException>}
 */
export const createStagingException = async exceptionData => {
  debug('Adding staging exception: %o', exceptionData)
  const exception = Object.assign(new StagingException(), exceptionData)
  await persist([exception])
  return exception
}

/**
 * Create a new staging exception from a JS {@link Error} object which has been thrown during processing
 *
 * @param {!string} stagingId the staging identifier associated with the exception
 * @param {!Error} exception the exception object thrown when the error occurred
 * @param {Object} transaction the transaction data which caused the exception to occur
 * @returns {Promise<StagingException>}
 */
export const createStagingExceptionFromError = async (stagingId, exception, transaction) => {
  return createStagingException({
    stagingId: stagingId,
    description: (exception.error && exception.error.message) || String(exception),
    transactionJson: JSON.stringify(transaction, null, 2),
    exceptionJson: JSON.stringify({ ...exception, stack: exception.stack.split('\n') }, null, 2)
  })
}

/**
 * @typedef {Object} TransactionFileError
 * @property {!string} name the transaction error name
 * @property {!string} description the description of the exception that occurred
 * @property {!string} json the transaction JSON data which caused the exception to occur
 * @property {!string} notes any additional notes to associated with the error
 * @property {!string} type the error type (Failure|Warning)
 * @property {!string} transactionFile the filename of the transaction file containing the error
 *
 * @param {TransactionFileError} transactionFileError
 * @returns {Promise<PoclStagingException>}
 */
export const createTransactionFileException = async transactionFileError => {
  debug('Adding exception for transaction file: %o', transactionFileError)
  const stagingException = Object.assign(new PoclStagingException(), {
    ...transactionFileError,
    type: await getGlobalOptionSetValue(PoclStagingException.definition.mappings.type.ref, transactionFileError.type),
    status: await getGlobalOptionSetValue(PoclStagingException.definition.mappings.status.ref, 'Open')
  })
  stagingException.bindToAlternateKey(PoclStagingException.definition.relationships.poclFile, transactionFileError.transactionFile)
  await persist([stagingException])
  return stagingException
}

/**
 * @typedef {Object} TransactionValidationError
 * @property {!object} createTransactionPayload the data used to create a transaction
 * @property {!object} finaliseTransactionPayload the transaction data
 *
 * @param {TransactionValidationError} record
 * @returns {Promise<PoclValidationError>}
 */
export const createDataValidationError = async record => {
  debug('Adding exception for POCL record: %o', record)
  const { dataSource, serialNumber, permissions: [permission] } = record.createTransactionPayload
  const { licensee, issueDate: transactionDate, ...otherPermissionData } = permission
  const validationErrorRecord = Object.assign(new PoclValidationError(), {
    dataSource,
    serialNumber,
    transactionDate,
    ...licensee,
    ...otherPermissionData,
    ...record.finaliseTransactionPayload.payment,
    status: 'Needs Review' // @IWTF-2174: add lookup here
  })
  await persist([validationErrorRecord])
  return validationErrorRecord
}
