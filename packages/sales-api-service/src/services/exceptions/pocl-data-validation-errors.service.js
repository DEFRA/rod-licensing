import { retrieveMultiple } from '@defra-fish/dynamics-lib'
import { PoclDataValidationError } from './temp/pocl-data-validation-error.entity.js'
/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export async function getPoclValidationErrors () {
  const validationErrors = await retrieveMultiple(PoclDataValidationError)
  const recordsReadyForProcessing = validationErrors.filter(record => record.status.label === 'Ready for Processing')
  return recordsReadyForProcessing
}
