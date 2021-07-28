import { executeQuery, findPoclValidationErrors } from '@defra-fish/dynamics-lib'
import { getGlobalOptionSetValue } from '../reference-data.service.js'

const POCL_VALIDATION_ERROR_STATUS_OPTIONSET = 'defra_poclvalidationerrorstatus'

const getRecords = async () => {
  const status = await getGlobalOptionSetValue(POCL_VALIDATION_ERROR_STATUS_OPTIONSET, 'Ready for Processing')
  return executeQuery(findPoclValidationErrors(status))
}

/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export async function getPoclValidationErrors () {
  console.log('about to retrieve validation errors')
  const records = await getRecords()
  console.log(`Retrieved ${records.length} records`, records)
  return records
}
