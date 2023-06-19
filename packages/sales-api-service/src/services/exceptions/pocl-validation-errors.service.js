import { executeQuery, findById, persist, findPoclValidationErrors, PoclValidationError } from '@defra-fish/dynamics-lib'
import { getGlobalOptionSetValue } from '../reference-data.service.js'
import db from 'debug'
import Boom from '@hapi/boom'
const debug = db('sales:pocl-validation-errors')

const POCL_VALIDATION_ERROR_STATUS_OPTIONSET = 'defra_poclvalidationerrorstatus'

/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export const getPoclValidationErrors = async () => {
  const status = await getGlobalOptionSetValue(POCL_VALIDATION_ERROR_STATUS_OPTIONSET, 'Ready for Processing')
  const results = await executeQuery(findPoclValidationErrors(status))
  return results.map(result => result.entity)
}

const getPaymentData = async payment => {
  const { source, method, ...rest } = payment
  return {
    ...rest,
    paymentSource: source,
    methodOfPayment: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.methodOfPayment.ref, method)
  }
}

const getStatus = async record => {
  const label = record.status ? record.status : 'Needs Review'
  return {
    status: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.status.ref, label),
    // if record has been processed, deactivate it
    ...(label === 'Processed' && { stateCode: 1 })
  }
}

const mapRecordPayload = async (record, transactionFile = null) => {
  const {
    dataSource,
    serialNumber,
    permissions: [permission]
  } = record.createTransactionPayload
  const { licensee, issueDate: transactionDate, concessions, ...otherPermissionData } = permission
  const { newPaymentSource } = record.finaliseTransactionPayload.payment
  return {
    serialNumber,
    transactionDate,
    ...licensee,
    ...otherPermissionData,
    ...(concessions && { concessions: JSON.stringify(concessions) }),
    ...(await getPaymentData(record.finaliseTransactionPayload.payment)),
    ...(await getStatus(record)),
    transactionFile: transactionFile || record.finaliseTransactionPayload.transactionFile,
    errorMessage: record.errorMessage || record.createTransactionError?.message,
    dataSource: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.dataSource.ref, dataSource),
    preferredMethodOfConfirmation: await getGlobalOptionSetValue(
      PoclValidationError.definition.mappings.preferredMethodOfConfirmation.ref,
      licensee.preferredMethodOfConfirmation
    ),
    preferredMethodOfNewsletter: await getGlobalOptionSetValue(
      PoclValidationError.definition.mappings.preferredMethodOfNewsletter.ref,
      licensee.preferredMethodOfNewsletter
    ),
    preferredMethodOfReminder: await getGlobalOptionSetValue(
      PoclValidationError.definition.mappings.preferredMethodOfReminder.ref,
      licensee.preferredMethodOfReminder
    ),
    newPaymentSource: await getGlobalOptionSetValue(PoclValidationError.definition.mappings.newPaymentSource.ref, newPaymentSource)
  }
}

/**
 * @typedef {Object} TransactionValidationError
 * @property {!object} createTransactionPayload the data used to create a transaction
 * @property {!object} finaliseTransactionPayload the transaction data
 *
 * @param {TransactionValidationError} record
 * @returns {Promise<PoclValidationError>}
 */
export const createPoclValidationError = async (record, transactionFile) => {
  debug('Adding exception for POCL record: %o & transaction file %s', record, transactionFile)
  debug('permission: ' + record.createTransactionPayload.permissions[0])
  debug('payment: ' + record.finaliseTransactionPayload)
  const data = await mapRecordPayload(record, transactionFile)
  const validationError = Object.assign(new PoclValidationError(), data)
  debug('Creating POCL validation error %s', validationError)
  return persist([validationError])
}

/**
 * @typedef {Object} TransactionValidationError
 * @property {!object} createTransactionPayload the data used to create a transaction
 * @property {!object} finaliseTransactionPayload the transaction data
 *
 * @param {String} id - guid id of POCL validation error to update
 * @param {TransactionValidationError} record
 * @returns {Promise<PoclValidationError>}
 */
export const updatePoclValidationError = async (id, payload) => {
  debug('Updating POCL validation record: %o', payload)
  const validationError = await findById(PoclValidationError, id)
  if (!validationError) {
    throw Boom.notFound('A POCL validation error with the given identifier could not be found')
  }
  const mappedRecord = await mapRecordPayload(payload)
  const updated = Object.assign(validationError, mappedRecord)
  await persist([updated])
  return updated
}
