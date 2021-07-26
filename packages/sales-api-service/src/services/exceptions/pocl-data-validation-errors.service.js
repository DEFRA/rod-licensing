import { retrieveMultiple, retrieveMultipleAsMap } from '@defra-fish/dynamics-lib'
import { PoclDataValidationError } from './temp/pocl-data-validation-error.entity.js'
/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export async function getPoclValidationErrors () {
  console.log('about to retrieve validation errors')
  const validationErrors = await retrieveMultiple(PoclDataValidationError).cached()
  const validationErrorsMap = await retrieveMultipleAsMap(PoclDataValidationError).cached()

  console.log({ validationErrors, validationErrorsMap })
  const recordsReadyForProcessing = validationErrors.filter(record => record.status.label === 'Ready for Processing')
  console.log({ recordsReadyForProcessing })
  return recordsReadyForProcessing
}
