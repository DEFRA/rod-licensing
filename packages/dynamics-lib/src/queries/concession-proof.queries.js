import { PredefinedQuery } from './predefined-query.js'
import { ConcessionProof } from '../entities/concession-proof.entity.js'

/**
 * Builds a query to retrieve a list of Concession Proofs and its related Concession when an array of ids is given
 *
 * @param concessionIds an array of ids
 * @returns {PredefinedQuery}
 */
export const concessionsByIds = concessionIds => {
  const { concession } = ConcessionProof.definition.relationships
  const filter = concessionIds.reduce(
    (accum, currentValue, index) =>
      index === 0
        ? `${ConcessionProof.definition.mappings.id.field} eq ${currentValue}`
        : (accum += ` or ${ConcessionProof.definition.mappings.id.field} eq ${currentValue}`),
    ''
  )

  return new PredefinedQuery({
    root: ConcessionProof,
    filter,
    expand: [concession]
  })
}
