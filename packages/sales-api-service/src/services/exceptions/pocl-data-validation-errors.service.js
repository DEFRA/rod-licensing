import { retrieveMultiple } from '@defra-fish/dynamics-lib'
import { PoclDataValidationError } from './temp/pocl-data-validation-error.entity.js'
/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export async function getPoclValidationErrors () {
  console.log('about to retrieve validation errors')
  const validationErrors = await retrieveMultiple(PoclDataValidationError).cached()
  const recordsReadyForProcessing = validationErrors.filter(record => {
    console.log({ record, status: record.status })
    return record.status.label === 'Needs Review'
  })
  console.log({ recordsReadyForProcessing })
  return recordsReadyForProcessing
}
