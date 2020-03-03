import uuidv4 from 'uuid/v4.js'
import util from 'util'
import Joi from '@hapi/joi'

/**
 * Base class for Dynamics entities
 */
export class BaseEntity {
  #etag = null
  #contentId = null
  #localState = {}
  #bindings = {}

  constructor () {
    this[util.inspect.custom] = this.toJSON
  }

  /**
   * Define mappings between Dynamics entity field and local entity field
   */
  static get definition () {
    throw new Error('Definition not defined in subclass')
  }

  /**
   * @returns {boolean} determining whether the entity is new (true) or existing (false) based on the presence of an etag
   */
  isNew () {
    return this.#etag == null
  }

  /**
   * @returns {string} the etag of the entity or null if not yet persisted
   */
  get etag () {
    return this.#etag
  }

  /**
   * Retrieve the state of an entity field
   *
   * @param property the field name
   * @returns {*} the value of the field
   * @private
   */
  _getState (property) {
    return this.#localState[property]
  }

  /**
   * Set the state of an entity field
   *
   * @param property the field name
   * @param value the value of the field to set
   * @returns {*} the value that is set
   * @private
   */
  _setState (property, value) {
    return (this.#localState[property] = value)
  }

  /**
   * Bind the entity
   *
   * @param property the binding to use including the @odata.bind directive
   * @param entity the entity instance to bind to
   * @returns {*}
   * @private
   */
  _bind (property, entity) {
    return (this.#bindings[property] = entity)
  }

  /**
   * @returns {string} a unique (uuid) identifier for this object instance (useful for batch creation requests)
   */
  get uniqueContentId () {
    return this.#contentId || (this.#contentId = uuidv4())
  }

  /**
   * @returns {string} the id of the entity
   */
  get id () {
    return this._getState('id')
  }

  /**
   * @returns {{}} a json representation of the entity state
   */
  toString () {
    return this.toJSON()
  }

  /**
   * @returns {{}} a json representation of the entity state
   */
  toJSON () {
    return this.#localState
  }

  /**
   * Convert the entity into the request body to use in a create/update query to the Dynamics ODATA Web API
   * @returns {{}} the JSON structure to use in a create/update query to the Dynamics ODATA Web API
   */
  toRequestBody () {
    return Object.entries(this.constructor.definition.mappings)
      .filter(([, { field }]) => !field.includes('@'))
      .reduce(
        (acc, [k, { field }]) => {
          if (this.#localState[k] !== undefined) acc[field] = this.#localState[k]
          return acc
        },
        Object.entries(this.#bindings).reduce((acc, [k, v]) => {
          acc[k] = v.id ? `/${v.constructor.definition.collection}(${v.id})` : `$${v.uniqueContentId}`
          return acc
        }, {})
      )
  }

  /**
   * Create a new entity using the response from a query to the Dynamics ODATA Web API
   *
   * @param etag the etag of the entity
   * @param properties the fields of the entity
   * @returns {BaseEntity} an instance of a BaseEntity subclass
   */
  static fromResponse ({ '@odata.etag': etag, ...properties }) {
    const instance = new this()
    instance.#etag = etag
    instance.#localState = Object.entries(this.definition.mappings).reduce((acc, [k, { field }]) => {
      acc[k] = properties[field]
      return acc
    }, {})
    return instance
  }
}

const metadataSchema = Joi.object({
  // Entity collection name
  collection: Joi.string()
    .min(1)
    .required(),
  // Default filter to apply
  defaultFilter: Joi.string(),
  // Relationships to expand
  expands: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      property: Joi.string()
        .min(1)
        .required(),
      select: Joi.array().items(Joi.string()),
      orderBy: Joi.array().items(Joi.string()),
      top: Joi.number()
    })
  ),
  // Mapping definition used by the mapping functions
  mappings: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      field: Joi.string()
        .min(1)
        .required()
    })
  )
})

export class EntityDefinition {
  #metadata = null
  #fields = null

  constructor (metadata) {
    const validation = metadataSchema.validate(metadata)
    if (validation.error) throw validation.error
    this.#metadata = metadata
    this.#fields = Object.values(metadata.mappings)
      .map(({ field }) => field)
      .filter(field => !field.includes('@'))
  }

  get collection () {
    return this.#metadata.collection
  }

  get defaultFilter () {
    return this.#metadata.defaultFilter
  }

  get mappings () {
    return this.#metadata.mappings
  }

  get select () {
    return this.#fields
  }

  toRetrieveRequest (filterString = this.defaultFilter) {
    return {
      collection: this.collection,
      select: this.select,
      filter: filterString,
      includeAnnotations: 'OData.Community.Display.V1.FormattedValue'
    }
  }
}
