import {
  getGlobalOptionSetValue,
  getReferenceDataForEntity,
  getReferenceDataForEntityAndId
} from '../../services/reference-data.service.js'
import { findById, findByAlternateKey, PermitConcession } from '@defra-fish/dynamics-lib'
import Joi from '@hapi/joi'

export function buildJoiOptionSetValidator (optionSetName, exampleValue) {
  return Joi.string()
    .trim()
    .required()
    .external(createOptionSetValidator(optionSetName))
    .description(`See ${optionSetName} option-set for available options`)
    .example(exampleValue)
}

export function createOptionSetValidator (optionSetName) {
  return async value => {
    if (value) {
      const option = await getGlobalOptionSetValue(optionSetName, value)
      if (!option) {
        throw new Error(`Value provided is not a recognised ${optionSetName}`)
      }
    }
    return undefined
  }
}

export function createReferenceDataEntityValidator (entityType) {
  return async value => {
    if (value) {
      const entity = await getReferenceDataForEntityAndId(entityType, value)
      if (!entity) {
        throw new Error(`Unrecognised ${entityType.definition.localName} identifier`)
      }
    }
    return undefined
  }
}

export function createEntityIdValidator (entityType, negate = false) {
  return async value => {
    if (value) {
      const entity = await findById(entityType, value)
      if (!negate && !entity) {
        throw new Error(`Unrecognised ${entityType.definition.localName} identifier`)
      } else if (negate && entity) {
        throw new Error(`Entity for ${entityType.definition.localName} identifier already exists`)
      }
    }
    return undefined
  }
}

/**
 * Create a validator which checks if an entity exists using an alternate key lookup
 *
 * @param {typeof BaseEntity} entityType the type of entity to check
 * @param {boolean} negate if true then validates that the entity does not exist, defaults to false
 * @returns {function(*=): undefined}
 */
export function createAlternateKeyValidator (entityType, negate = false) {
  if (!entityType.definition.alternateKey) {
    throw new Error(`The entity ${entityType.name} does not support alternate key lookups`)
  }

  return async value => {
    if (value) {
      const entity = await findByAlternateKey(entityType, value)
      if (!negate && !entity) {
        throw new Error(`Unrecognised ${entityType.definition.localName} identifier`)
      } else if (negate && entity) {
        throw new Error(`Entity for ${entityType.definition.localName} identifier already exists`)
      }
    }
    return undefined
  }
}

/**
 * Create a validator that will check that the provided concessionId (if present) is valid for the given permitId
 * @returns {function(*): undefined}
 */
export function createPermitConcessionValidator () {
  return async permission => {
    if (permission) {
      const permitConcessions = await getReferenceDataForEntity(PermitConcession)
      const concessionsRequiredForPermit = permitConcessions.filter(pc => pc.permitId === permission.permitId)
      const hasConcessionProofs = permission.concessions && permission.concessions.length
      // Check that the concession is valid for the given permitId and that if a permit requires a concession reference that one is defined
      if (concessionsRequiredForPermit.length && !hasConcessionProofs) {
        throw new Error(`The permit '${permission.permitId}' requires proof of concession however none were supplied`)
      } else if (!concessionsRequiredForPermit.length && hasConcessionProofs) {
        throw new Error(`The permit '${permission.permitId}' does not allow concessions but concession proofs were supplied`)
      } else {
        // Check list for duplicates
        const counts = permission.concessions.reduce((acc, c) => ({ ...acc, [c.id]: (acc[c.id] || 0) + 1 }), {})
        const duplicates = Object.keys(counts).filter(k => counts[k] > 1)
        if (duplicates.length) {
          throw new Error(`The concession ids '${duplicates}' appear more than once, duplicates are not permitted`)
        }

        // Check concession allowed for permit
        permission.concessions.forEach(concession => {
          if (!concessionsRequiredForPermit.find(pc => concession.id === pc.concessionId)) {
            throw new Error(`The concession '${concession.id}' is not valid with respect to the permit '${permission.permitId}'`)
          }
        })
      }
    }
    return undefined
  }
}
