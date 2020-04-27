import {
  Permit,
  Concession,
  TransactionCurrency,
  PermitConcession,
  retrieveMultipleAsMap,
  retrieveGlobalOptionSets
} from '@defra-fish/dynamics-lib'

export const ENTITY_TYPES = [Permit, Concession, TransactionCurrency, PermitConcession]

export async function getReferenceData () {
  return retrieveMultipleAsMap(...ENTITY_TYPES).cached()
}

/**
 * Retrieve all reference data records for the given entity type
 *
 * @template T
 * @param {typeof T} entityType
 * @returns {Promise<Array<T>>}
 */
export async function getReferenceDataForEntity (entityType) {
  const data = await getReferenceData()
  return data[entityType.definition.localCollection]
}

/**
 *
 * @template T
 * @param {typeof T} entityType
 * @param {string} id
 * @returns {Promise<T>}
 */
export async function getReferenceDataForEntityAndId (entityType, id) {
  const data = await getReferenceData()
  const items = data[entityType.definition.localCollection].filter(p => p.id === id)
  return (items.length && items[0]) || undefined
}

export async function getGlobalOptionSets (...names) {
  return retrieveGlobalOptionSets(...names).cached()
}

export async function getGlobalOptionSet (name) {
  const definition = await retrieveGlobalOptionSets(name).cached()
  return definition[name]
}

export async function getGlobalOptionSetValue (name, label) {
  const definition = await retrieveGlobalOptionSets(name).cached()
  const options =
    definition[name] && label ? Object.values(definition[name].options).filter(o => o.label.toLowerCase() === label.toLowerCase()) : []
  return (options.length && options[0]) || undefined
}
