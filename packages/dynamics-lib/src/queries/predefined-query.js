export class PredefinedQuery {
  /**
   * Create a new PredefinedQuery
   *
   * @param {typeof BaseEntity} root the entity class acting as the root of the query
   * @param {string} filter the ODATA filter to apply to the query
   * @param {Array<Relationship>} [expands] optional relationships to be expanded when the query is executed
   */
  constructor ({ root, filter, expands }) {
    this._root = root
    this._retrieveRequest = {
      ...root.definition.toRetrieveRequest(filter),
      ...(expands && {
        expand: expands.map(e => ({
          property: e.property,
          select: e.entity.definition.select
        }))
      })
    }
  }

  /**
   * @returns {{filter: string?, expands: Array<Expand>, select: Array<String>, collection: !string}}
   */
  toRetrieveRequest () {
    return this._retrieveRequest
  }

  /**
   * @param results
   * @param optionSetData
   * @returns {Array<Object>}
   */
  fromResponse (results, optionSetData) {
    return results.map(r => ({
      [this._root.definition.localName]: this._root.fromResponse(r, optionSetData),
      ...Object.entries(this._root.definition.relationships).reduce((acc, [relationName, relationDefinition]) => {
        if (r[relationDefinition.property]) {
          if (relationDefinition.parent) {
            acc[relationName] = relationDefinition.entity.fromResponse(r[relationDefinition.property], optionSetData)
          } else {
            acc[relationName] = r[relationDefinition.property].map(entry => relationDefinition.entity.fromResponse(entry, optionSetData))
          }
        }
        return acc
      }, {})
    }))
  }
}
