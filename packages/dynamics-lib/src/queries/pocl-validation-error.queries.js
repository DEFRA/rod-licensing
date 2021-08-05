import { PredefinedQuery } from './predefined-query.js'
import { PoclValidationError } from '../entities/pocl-validation-error.entity.js'

/**
 * Builds a query to retrieve validation errors with optional status filter
 *
 * @returns {PredefinedQuery<PoclValidationError>}
 */

export const findPoclValidationErrors = (status = null) => {
  const filters = []
  if (status) {
    filters.push(`${PoclValidationError.definition.mappings.status.field} eq ${status.id}`)
  }
  filters.push(`${PoclValidationError.definition.defaultFilter}`)

  return new PredefinedQuery({ root: PoclValidationError, filter: filters.join(' and ') })
}
