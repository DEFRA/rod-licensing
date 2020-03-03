import dynamicsWebApi from '../client/dynamics-client.js'

export async function persist (...entities) {
  dynamicsWebApi.startBatch()
  entities.forEach(e => {
    const body = e.toRequestBody()
    if (e.isNew()) {
      dynamicsWebApi.createRequest({ entity: body, collection: e.constructor.definition.collection, contentId: e.uniqueContentId })
    } else {
      dynamicsWebApi.updateRequest({
        key: e.id,
        entity: body,
        collection: e.constructor.definition.collection,
        contentId: e.uniqueContentId
      })
    }
  })
  return dynamicsWebApi.executeBatch()
}

export async function retrieveMultiple (...entityClasses) {
  dynamicsWebApi.startBatch()
  entityClasses.forEach(cls => dynamicsWebApi.retrieveMultipleRequest(cls.definition.toRetrieveRequest()))
  const results = (await dynamicsWebApi.executeBatch()).map((result, i) => result.value.map(v => entityClasses[i].fromResponse(v)))
  return (results.length === 1 && results[0]) || results
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
  const results = await dynamicsWebApi.retrieveMultipleRequest(entity.constructor.definition.toRetrieveRequest(filterString))
  return results.value.map(result => entity.constructor.fromResponse(result))
}
