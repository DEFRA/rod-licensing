import { executeQuery, findById, persist, findPoclValidationErrors, PoclValidationError } from '@defra-fish/dynamics-lib'
import { getGlobalOptionSetValue } from '../reference-data.service.js'

const POCL_VALIDATION_ERROR_STATUS_OPTIONSET = 'defra_poclvalidationerrorstatus'

/**
 * Query for POCL data validation errors with 'Ready for Processing' status
 * @param {*} payload
 * @returns {Array<Object>}
 */
export const getPoclValidationErrors = async () => {
  const status = await getGlobalOptionSetValue(POCL_VALIDATION_ERROR_STATUS_OPTIONSET, 'Ready for Processing')
  const results = await executeQuery(findPoclValidationErrors(status))
  return results.map(result => result.entity)
}

export const updatePoclValidationError = async (id, payload) => {
  const validationError = await findById(PoclValidationError, id)

  const updated = Object.assign(validationError, payload)
  await persist([updated])
}
