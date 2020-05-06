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

/**
 * Retrieve a global option set value by the given lookup.  The label and description fields are examined to find a match.
 *
 * @param {string} name The name of the global option set to examine
 * @param {string} lookup The value used to find a match
 * @returns {Promise<GlobalOptionSetDefinition|undefined>}
 */
export async function getGlobalOptionSetValue (name, lookup) {
  const llookup = lookup && lookup.toLowerCase()
  const definition = await retrieveGlobalOptionSets(name).cached()
  return definition[name] && lookup
    ? Object.values(definition[name].options).find(o => o.label.toLowerCase() === llookup || o.description.toLowerCase() === llookup)
    : undefined
}
