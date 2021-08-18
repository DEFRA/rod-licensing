import { PredefinedQuery } from './predefined-query.js'
import { ConcessionProof } from '../entities/concession-proof.entity.js'

/**
 * Builds a query to retrieve a list of Concession Proofs and its related Concession when an array of ids is given
 *
 * @param concessionIds an array of ids
 * @returns {PredefinedQuery}
 */
export const concessionsByIds = concessionIds => {
  if (!Array.isArray(concessionIds)) {
    throw new Error('concessionIds must be an array')
  }

  // passing an empty array returns all the concession proofs
  if (concessionIds.length === 0) {
    throw new Error('concessionIds must not be empty')
  }

  const { concession } = ConcessionProof.definition.relationships
  let filter = concessionIds.reduce(
    (accum, currentValue, index) =>
      index === 0
        ? `${ConcessionProof.definition.mappings.id.field} eq ${currentValue}`
        : accum + ` or ${ConcessionProof.definition.mappings.id.field} eq ${currentValue}`,
    ''
  )
  filter += ` and ${ConcessionProof.definition.defaultFilter}`

  return new PredefinedQuery({
    root: ConcessionProof,
    filter: filter,
    expand: [concession]
  })
}
