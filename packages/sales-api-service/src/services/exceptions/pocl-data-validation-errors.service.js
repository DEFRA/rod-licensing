import { dynamicsClient, retrieveGlobalOptionSets } from '@defra-fish/dynamics-lib'
import { PoclValidationError } from './temp/pocl-data-validation-error.entity.js'

const POCL_VALIDATION_ERROR_STATUS_OPTIONSET = 'defra_poclvalidationerrorstatus'

const getRecords = async () => {
  const statuses = await retrieveGlobalOptionSets().cached()
  const status = Object.values(statuses[POCL_VALIDATION_ERROR_STATUS_OPTIONSET].options).find(o => o.label === 'Ready for Processing')

  const filters = [
    `${PoclValidationError.definition.mappings.status.field} eq ${status.id}`,
    `${PoclValidationError.definition.defaultFilter}`
  ]

  const { value } = await dynamicsClient.retrieveMultipleRequest(
    PoclValidationError.definition.toRetrieveRequest(filters.join(' and '))
  )
  console.log(`Retrieved ${value.length} records`, value)
  return value
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
