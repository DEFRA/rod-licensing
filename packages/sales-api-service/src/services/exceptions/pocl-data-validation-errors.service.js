import { dynamicsClient, findPoclValidationErrors } from '@defra-fish/dynamics-lib'
import { getGlobalOptionSetValue } from '../reference-data.service.js'

const POCL_VALIDATION_ERROR_STATUS_OPTIONSET = 'defra_poclvalidationerrorstatus'

// @IWTF-2175: Remove after testing
// import { PoclValidationError } from './temp/pocl-data-validation-error.entity.js'

// const getRecords = async () => {

//   const filters = [
//     `${PoclValidationError.definition.mappings.status.field} eq ${status.id}`,
//     `${PoclValidationError.definition.defaultFilter}`
//   ]

//   const { value } = await dynamicsClient.retrieveMultipleRequest(
//     PoclValidationError.definition.toRetrieveRequest(filters.join(' and '))
//   )
//   console.log(`Retrieved ${value.length} records`, value)
//   return value
// }

/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export async function getPoclValidationErrors () {
  console.log('about to retrieve validation errors')
  const status = await getGlobalOptionSetValue(POCL_VALIDATION_ERROR_STATUS_OPTIONSET, 'Ready for Processing')
  const records = await findPoclValidationErrors(status)
  console.log(`Retrieved ${records.length} records`, records)
  return records
}
