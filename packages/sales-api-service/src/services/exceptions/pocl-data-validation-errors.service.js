import { dynamicsClient } from '@defra-fish/dynamics-lib'
import { PoclDataValidationError } from './temp/pocl-data-validation-error.entity.js'
const READY_FOR_PROCESSING_ID = 910400001

const getRecords = async () => {
  const filters = [
    `${PoclDataValidationError.definition.mappings.status.field} eq ${READY_FOR_PROCESSING_ID}`,
    `${PoclDataValidationError.definition.defaultFilter}`
  ]

  // perform a multiple records retrieve operation
  return dynamicsClient.retrieveMultipleRequest(PoclDataValidationError.definition.toRetrieveRequest(filters.join(' and ')))
}

/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export async function getPoclValidationErrors () {
  console.log('about to retrieve validation errors')
  const validationErrors = await getRecords()
  const recordsReadyForProcessing = validationErrors.filter(record => {
    console.log({ record, status: record.status })
    return record.status.label === 'Needs Review'
  })
  console.log({ recordsReadyForProcessing })
  return recordsReadyForProcessing
}
