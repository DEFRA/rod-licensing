import { executeQuery, retrieveGlobalOptionSets, findPoclValidationErrors } from '@defra-fish/dynamics-lib'

const POCL_VALIDATION_ERROR_STATUS_OPTIONSET = 'defra_poclvalidationerrorstatus'

const getRecords = async () => {
  const statuses = await retrieveGlobalOptionSets().cache()
  const status = Object.values(statuses[POCL_VALIDATION_ERROR_STATUS_OPTIONSET].options).find(o => o.label === 'Ready for Processing')
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
}
