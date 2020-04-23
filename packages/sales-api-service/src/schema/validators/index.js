import { getGlobalOptionSetValue, getReferenceDataForEntityAndId } from '../../services/reference-data.service.js'
import { findById } from '@defra-fish/dynamics-lib'
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
