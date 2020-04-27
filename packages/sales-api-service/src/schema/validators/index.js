import {
  getGlobalOptionSetValue,
  getReferenceDataForEntity,
  getReferenceDataForEntityAndId
} from '../../services/reference-data.service.js'
import { findById, PermitConcession } from '@defra-fish/dynamics-lib'
import Joi from '@hapi/joi'

export function createOptionSetValidator (optionSetName, exampleValue) {
  return Joi.string()
    .trim()
    .external(async value => {
      const option = await getGlobalOptionSetValue(optionSetName, value)
      if (!option) {
        throw new Error(`Value provided is not a recognised ${optionSetName}`)
      }
      return undefined
    })
    .required()
    .description(`See ${optionSetName} option-set for available options`)
    .example(exampleValue)
}

export function createReferenceDataEntityValidator (entityType) {
  return async value => {
    const entity = await getReferenceDataForEntityAndId(entityType, value)
    if (!entity) {
      throw new Error(`Unrecognised ${entityType.definition.localCollection} identifier`)
    }
    return undefined
  }
}

export function createEntityIdValidator (entityType, negate = false) {
  return async value => {
    const entity = await findById(entityType, value)
    if (!negate && !entity) {
      throw new Error(`Unrecognised ${entityType.definition.localCollection} identifier`)
    } else if (negate && entity) {
      throw new Error(`Entity for ${entityType.definition.localCollection} identifier already exists`)
    }
    return undefined
  }
}

export function createAlternateKeyValidator (entityType, alternateKeyProperty, negate = false) {
  return async value => {
    const entity = await findById(entityType, `${alternateKeyProperty}='${value}'`)
    if (!negate && !entity) {
      throw new Error(`Unrecognised ${entityType.definition.localCollection} identifier`)
    } else if (negate && entity) {
      throw new Error(`Entity for ${entityType.definition.localCollection} identifier already exists`)
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
    const concessionId = (permission.concession && permission.concession.concessionId) || undefined
    const permitConcessions = await getReferenceDataForEntity(PermitConcession)
    const entriesForPermit = permitConcessions.filter(pc => pc.permitId)

    // Check that concessions is valid for the given permitId and that if a permit requires a concession reference that one is defined
    if (entriesForPermit.length && !entriesForPermit.find(pc => concessionId === pc.concessionId)) {
      throw new Error(`The concession '${concessionId}' is not valid with respect to the permit '${permission.permitId}'`)
    }
  }
}
