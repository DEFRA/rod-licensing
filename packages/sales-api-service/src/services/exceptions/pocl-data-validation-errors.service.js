import { dynamicsClient } from '@defra-fish/dynamics-lib'
import { getGlobalOptionSetValue } from '../reference-data.service.js'

// @IWTF-2175: Remove after testing
import { PoclValidationError } from './temp/pocl-data-validation-error.entity.js'

const getRecords = async () => {
  const status = await getGlobalOptionSetValue(
    PoclValidationError.definition.mappings.status.ref,
    'Ready for Processing'
  )

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
