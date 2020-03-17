import { dynamicsClient } from '../client/dynamics-client.js'
import GlobalOptionSetDefinition from '../optionset/global-option-set-definition.js'
// Note: When node14 is released we can replace dotProp with optional chaining!
import dotProp from 'dot-prop'
import cache from './cache.js'

export async function persist (...entities) {
  dynamicsClient.startBatch()
  entities.forEach(e => {
    const body = e.toRequestBody()
    if (e.isNew()) {
      dynamicsClient.createRequest({ entity: body, collection: e.constructor.definition.collection, contentId: e.uniqueContentId })
    } else {
      dynamicsClient.updateRequest({
        key: e.id,
        entity: body,
        collection: e.constructor.definition.collection,
        contentId: e.uniqueContentId
      })
    }
  })
  return dynamicsClient.executeBatch()
}

class CacheableOperation {
  constructor (cacheKey, fetchOp, resultProcessor) {
    this._cacheKey = cacheKey
    this._fetchOp = fetchOp
    this._resultProcessor = resultProcessor
  }

  async execute () {
    return this._resultProcessor(await this._fetchOp())
  }

  async cached () {
    const data = await cache.wrap(this._cacheKey, this._fetchOp)
    return this._resultProcessor(data)
  }
}

const retrieveMultipleFetchOperation = async entityClasses => {
  dynamicsClient.startBatch()
  entityClasses.forEach(cls => dynamicsClient.retrieveMultipleRequest(cls.definition.toRetrieveRequest()))
  return dynamicsClient.executeBatch()
}

export function retrieveMultiple (...entityClasses) {
  const entityClsKeys = entityClasses.map(e => e.name).join('_')
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

export function retrieveMultipleAsMap (...entityClasses) {
  const entityClsKeys = entityClasses.map(e => e.name).join('_')
  return new CacheableOperation(
    `dynamics_${entityClsKeys}`,
    async () => retrieveMultipleFetchOperation(entityClasses),
    async data => {
      const optionSetData = await retrieveGlobalOptionSets().cached()
      return data
        .map((result, i) => result.value.map(v => entityClasses[i].fromResponse(v, optionSetData)))
        .reduce((acc, val, idx) => {
          acc[entityClasses[idx].name] = val
          return acc
        }, {})
    }
  )
}

export function retrieveGlobalOptionSets (...names) {
  return new CacheableOperation(
    'dynamics_optionsets',
    async () => {
      const data = await dynamicsClient.retrieveGlobalOptionSets('Microsoft.Dynamics.CRM.OptionSetMetadata', ['Name', 'Options'])
      return data.value.map(({ Name: name, Options: options }) => ({
        name,
        options: options.map(o => ({
          id: o.Value,
          label: dotProp.get(o, 'Label.UserLocalizedLabel.Label', ''),
          description: dotProp.get(o, 'Description.UserLocalizedLabel.Label', '')
        }))
      }))
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

export async function findByExample (entity) {
  const filter = [
    entity.constructor.definition.defaultFilter,
    ...Object.entries(entity.toRequestBody())
      .map(([key, val]) => {
        let result = null
        if (val !== undefined) {
          const valType = typeof val
          if (val !== null && valType === 'string') {
            result = `${key} eq '${val}'`
          } else {
            result = `${key} eq ${val}`
          }
        }
        return result
      })
      .filter(v => !!v)
  ]

  const filterString = filter.join(' and ')
  const results = await dynamicsClient.retrieveMultipleRequest(entity.constructor.definition.toRetrieveRequest(filterString))
  return results.value.map(result => entity.constructor.fromResponse(result))
}
