import { dynamicsClient } from '@defra-fish/dynamics-lib'
import { PoclDataValidationError } from './temp/pocl-data-validation-error.entity.js'
const READY_FOR_PROCESSING_ID = 910400000 // change last digit to 1

/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export async function getPoclValidationErrors () {
  console.log('about to retrieve validation errors')
  const filters = [
    `${PoclDataValidationError.definition.mappings.status.field} eq ${READY_FOR_PROCESSING_ID}`,
    `${PoclDataValidationError.definition.defaultFilter}`
  ]

  const { value } = await dynamicsClient.retrieveMultipleRequest(
    PoclDataValidationError.definition.toRetrieveRequest(filters.join(' and '))
  )
  console.log(`Retrieved ${value.length} records`, value)
  return value
}
