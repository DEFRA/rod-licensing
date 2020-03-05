import { dynamicsClient } from '../client/dynamics-client.js'

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

export async function retrieveMultiple (...entityClasses) {
  dynamicsClient.startBatch()
  entityClasses.forEach(cls => dynamicsClient.retrieveMultipleRequest(cls.definition.toRetrieveRequest()))
  const results = (await dynamicsClient.executeBatch()).map((result, i) => result.value.map(v => entityClasses[i].fromResponse(v)))
  return (results.length === 1 && results[0]) || results
}

export async function retrieveMultipleAsMap (...entityClasses) {
  dynamicsClient.startBatch()
  entityClasses.forEach(cls => dynamicsClient.retrieveMultipleRequest(cls.definition.toRetrieveRequest()))
  const results = (await dynamicsClient.executeBatch()).map((result, i) => result.value.map(v => entityClasses[i].fromResponse(v)))
  return results.reduce((acc, val, idx) => {
    acc[entityClasses[idx].name] = val
    return acc
  }, {})
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
