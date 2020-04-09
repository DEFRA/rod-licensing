import {
  Permit,
  Concession,
  TransactionCurrency,
  PermitConcession,
  retrieveMultipleAsMap,
  retrieveGlobalOptionSets
} from '@defra-fish/dynamics-lib'

export async function getReferenceData () {
  return retrieveMultipleAsMap(Permit, Concession, PermitConcession, TransactionCurrency).cached()
}

/**
 *
 * @template T
 * @param {typeof T} entityType
 * @param {string} id
 * @returns {Promise<T>}
 */
export async function getReferenceDataForId (entityType, id) {
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
  const options = definition[name] ? Object.values(definition[name].options).filter(o => o.label.toLowerCase() === label.toLowerCase()) : []
  return (options.length && options[0]) || undefined
}
