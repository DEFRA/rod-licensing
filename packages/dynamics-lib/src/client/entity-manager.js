import { dynamicsClient } from '../client/dynamics-client.js'
import { GlobalOptionSetDefinition } from '../optionset/global-option-set-definition.js'
// Note: When node14 is released we can replace dotProp with optional chaining!
import dotProp from 'dot-prop'
import { CacheableOperation } from './cache.js'

/**
 * Persist the provided entities.  Uses a create or update request as appropriate based on the state of the entity.
 *
 * @param {...Object<BaseEntity>} entities the entities which shall be persisted
 * @returns {Promise<string[]>} resolving to the ids of the persisted entities
 */
export async function persist (...entities) {
  try {
    dynamicsClient.startBatch()
    entities.forEach(e => {
      const body = e.toRequestBody()
      if (e.isNew()) {
        dynamicsClient.createRequest({
          entity: body,
          collection: e.constructor.definition.dynamicsCollection,
          contentId: e.uniqueContentId
        })
      } else {
        dynamicsClient.updateRequest({
          key: e.id,
          entity: body,
          collection: e.constructor.definition.dynamicsCollection,
          contentId: e.uniqueContentId
        })
      }
    })
    return await dynamicsClient.executeBatch()
  } catch (e) {
    const error = e.length ? e[0] : e
    console.error('Unable to persist:', error)
    throw error
  }
}

const retrieveMultipleFetchOperation = async entityClasses => {
  try {
    dynamicsClient.startBatch()
    entityClasses.forEach(cls => dynamicsClient.retrieveMultipleRequest(cls.definition.toRetrieveRequest()))
    return await dynamicsClient.executeBatch()
  } catch (e) {
    const error = e.length ? e[0] : e
    console.error('Unable to retrieveMultiple:', error)
    throw error
  }
}

/**
 * Sends an asynchronous request to retrieve records.  The number of records retrieved is determined by the configured page size in Dynamics (5000)
 *
 * Records are returned as:
 *  - an array of records if only a single entity class is provided
 *  - a 2-dimensional array of records if multiple entity classes are provided
 *
 * @param {typeof BaseEntity} entityClasses the entity classes to perform a retrieve operation on
 * @returns {CacheableOperation}
 */
export function retrieveMultiple (...entityClasses) {
  const entityClsKeys = entityClasses.map(e => e.definition.localCollection).join('_')
  return new CacheableOperation(
    `dynamics_${entityClsKeys}`,
    async () => retrieveMultipleFetchOperation(entityClasses),
    async data => {
      const optionSetData = await retrieveGlobalOptionSets().cached()
      const results = data.map((result, i) => result.value.map(v => entityClasses[i].fromResponse(v, optionSetData)))
      return (results.length === 1 && results[0]) || results
    }
  )
}

/**
 * Sends an asynchronous request to retrieve records.  The number of records retrieved is determined by the configured page size in Dynamics (5000)
 *
 * Records are returned as an object containing keys determined by the localCollection property of the definition for each entity class provided
 *
 * @param {typeof BaseEntity} entityClasses the entity classes to perform a retrieve operation on
 * @returns {CacheableOperation}
 */
export function retrieveMultipleAsMap (...entityClasses) {
  const entityClsKeys = entityClasses.map(e => e.definition.localCollection).join('_')
  return new CacheableOperation(
    `dynamics_${entityClsKeys}`,
    async () => retrieveMultipleFetchOperation(entityClasses),
    async data => {
      const optionSetData = await retrieveGlobalOptionSets().cached()
      return data
        .map((result, i) => result.value.map(v => entityClasses[i].fromResponse(v, optionSetData)))
        .reduce((acc, val, idx) => {
          acc[entityClasses[idx].definition.localCollection] = val
          return acc
        }, {})
    }
  )
}

/**
 * Retrieve the available GlobalOptionSets from Dynamics, optionally filtered by the provided names
 *
 * @param {...string} names the names of the GlobalOptionSets to be retrieved
 * @returns {CacheableOperation}
 */
export function retrieveGlobalOptionSets (...names) {
  return new CacheableOperation(
    'dynamics_optionsets',
    async () => {
      try {
        const data = await dynamicsClient.retrieveGlobalOptionSets('Microsoft.Dynamics.CRM.OptionSetMetadata', ['Name', 'Options'])
        return data.value.map(({ Name: name, Options: options }) => ({
          name,
          options: options.map(o => ({
            id: o.Value,
            label: dotProp.get(o, 'Label.UserLocalizedLabel.Label', ''),
            description: dotProp.get(o, 'Description.UserLocalizedLabel.Label', '')
          }))
        }))
      } catch (e) {
        console.error('Error attempting to retrieveGlobalOptionSets', e)
        throw e
      }
    },
    data => {
      return data
        .filter(({ name }) => !names.length || names.includes(name))
        .reduce((optionSetData, { name, options }) => {
          optionSetData[name] = {
            name,
            options: options.reduce((optionSetMapping, o) => {
              optionSetMapping[o.id] = new GlobalOptionSetDefinition(name, o)
              return optionSetMapping
            }, {})
          }
          return optionSetData
        }, {})
    }
  )
}

/**
 * Retrieve records from Dynamics which match each of the fields populated in the example entity
 *
 * @param {Object<BaseEntity>} entity the example entity to construct a query from
 * @returns {Promise<Array<BaseEntity>>} an array of matching records
 */
export async function findByExample (entity) {
  try {
    const filter = [
      entity.constructor.definition.defaultFilter,
      ...Object.entries(entity.constructor.definition.mappings).reduce((acc, [property, { field, type }]) => {
        let serialized = entity._toSerialized(property)
        if (serialized !== undefined) {
          if (type === 'string') {
            serialized = `'${serialized}'`
          }
          acc[acc.length] = `${field} eq ${serialized}`
        }
        return acc
      }, [])
    ].join(' and ')
    const optionSetData = await retrieveGlobalOptionSets().cached()
    const results = await dynamicsClient.retrieveMultipleRequest(entity.constructor.definition.toRetrieveRequest(filter))
    return results.value.map(result => entity.constructor.fromResponse(result, optionSetData))
  } catch (e) {
    console.error('Unable to findByExample:', e)
    throw e
  }
}
