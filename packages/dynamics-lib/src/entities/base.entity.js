import uuidv4 from 'uuid/v4.js'
import util from 'util'
import Joi from '@hapi/joi'
import { GlobalOptionSetDefinition } from '../optionset/global-option-set-definition.js'
import moment from 'moment'

/**
 * Base class for Dynamics entities
 * @class
 * @abstract
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
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    throw new Error('Definition not defined in subclass')
  }

  /**
   * Indicates whether the entity is new (true) or existing (false) based on the presence of an etag
   *
   * @returns {boolean} true if the entity has not been persisted, false otherwise
   */
  isNew () {
    return !!this.#etag
  }

  /**
   * the etag of the entity or null if not yet persisted
   * @readonly
   * @returns {string}
   */
  get etag () {
    return this.#etag
  }

  /**
   * Retrieve the state of an entity field
   *
   * @param property the field name
   * @returns {*} the value of the field
   * @protected
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
   * @protected
   */
  _setState (property, value) {
    const mapping = this.constructor.definition.mappings[property]
    if (!mapping) {
      throw new Error('Unrecognised property mapping')
    }

    let valueToSet = value
    if (valueToSet !== undefined && valueToSet !== null) {
      if (mapping.type === 'integer') {
        valueToSet = Number(value)
        if (Number.isNaN(valueToSet) || valueToSet - Math.floor(valueToSet) !== 0) {
          throw new Error('Value is not an integer')
        }
      } else if (mapping.type === 'decimal') {
        valueToSet = Number(value)
        if (Number.isNaN(valueToSet)) {
          throw new Error('Value is not an decimal')
        }
      } else if (mapping.type === 'boolean') {
        if (valueToSet !== false && valueToSet !== true) {
          throw new Error('Value is not an boolean')
        }
      } else if (mapping.type === 'date' || mapping.type === 'datetime') {
        if (!moment(valueToSet).isValid()) {
          throw new Error('Value is not a valid date')
        }
      } else if (mapping.type === 'optionset') {
        if (!(valueToSet instanceof GlobalOptionSetDefinition) || valueToSet.optionSetName !== mapping.ref) {
          throw new Error('Value is not a valid GlobalOptionSetDefinition')
        }
      } else {
        valueToSet = String(value)
      }
    }
    return (this.#localState[property] = valueToSet)
  }

  /**
   * Serialize an entity property into the format suitable for a Dynamics request
   *
   * @param property the field name
   * @returns {*} the value that is set
   * @protected
   */
  _toSerialized (property) {
    let value = this.#localState[property]
    if (value !== undefined && value !== null) {
      const type = this.constructor.definition.mappings[property].type
      if (type === 'date') {
        value = moment(value).format('YYYY-MM-DD')
      } else if (type === 'datetime') {
        value = moment(value)
          .utc()
          .format('YYYY-MM-DDTHH:mm:ss[Z]')
      } else if (type === 'optionset') {
        value = value.id
      }
    }
    return value
  }

  /**
   * Bind the entity
   *
   * @param property the binding to use including the @odata.bind directive
   * @param entity the entity instance to bind to
   * @returns {*}
   * @protected
   */
  _bind (property, entity) {
    return (this.#bindings[property] = entity)
  }

  /**
   * a unique (uuid) identifier for this object instance (useful for batch creation requests)
   * @type {string}
   * @readonly
   */
  get uniqueContentId () {
    return this.#contentId || (this.#contentId = uuidv4())
  }

  /**
   * the id of the entity
   * @type {string}
   * @readonly
   */
  get id () {
    return this._getState('id')
  }

  /**
   * @returns {{}} a json representation of the entity state
   */
  toString () {
    return JSON.stringify(this.toJSON(), null, 2)
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
        (acc, [property, { field }]) => {
          const serialized = this._toSerialized(property)
          if (serialized !== undefined) {
            acc[field] = serialized
          }
          return acc
        },
        Object.entries(this.#bindings).reduce((acc, [k, v]) => {
          acc[k] = v.id ? `/${v.constructor.definition.dynamicsCollection}(${v.id})` : `$${v.uniqueContentId}`
          return acc
        }, {})
      )
  }

  /**
   * Create a new entity using the response from a query to the Dynamics ODATA Web API
   *
   * @param {string} etag the etag of the entity
   * @param {Object} fields the fields of the entity
   * @params {Object} optionSetData the global option set data used to resolve option set fields
   * @returns {BaseEntity} an instance of a BaseEntity subclass
   */
  static fromResponse ({ '@odata.etag': etag, ...fields }, optionSetData) {
    const instance = new this()
    instance.#etag = etag
    instance.#localState = Object.entries(this.definition.mappings).reduce((acc, [property, { field, type, ref }]) => {
      let value = fields[field]
      if (value !== undefined) {
        if (value !== null) {
          if (type === 'integer' || type === 'decimal') {
            value = Number(value)
          } else if (type === 'optionset') {
            const optionSetEntries = optionSetData[ref]
            if (optionSetEntries) {
              value = optionSetEntries.options[value]
            } else {
              throw new Error(`Unable to find optionset entries for ${ref}`)
            }
          }
        }
        acc[property] = value
      }

      return acc
    }, {})
    return instance
  }
}

/**
 * Schema for entity definitions
 *
 * @typedef {Object} MetadataSchema
 * @property {!string} localCollection the local collection name
 * @property {!string} dynamicsCollection the dynamics collection name
 * @property {string} [defaultFilter] the default filter to use when retrieving records
 * @property {Object} mappings the mappings between the local collection fields and the dynamics fields
 */
const metadataSchema = Joi.object({
  // Local entity collection name
  localCollection: Joi.string()
    .min(1)
    .required(),
  // Dynamics entity collection name
  dynamicsCollection: Joi.string()
    .min(1)
    .required(),
  // Default filter to apply
  defaultFilter: Joi.string(),
  // Mapping definition used by the mapping functions
  mappings: Joi.object().pattern(
    Joi.string(),
    Joi.object({
      field: Joi.string()
        .min(1)
        .required(),
      type: Joi.string()
        .valid('string', 'integer', 'decimal', 'boolean', 'date', 'datetime', 'optionset')
        .required(),
      ref: Joi.when('type', {
        is: 'optionset',
        then: Joi.string()
          .min(1)
          .required(),
        otherwise: Joi.forbidden()
      })
    })
  )
})

/**
 * Definition metadata for an entity
 * @class
 */
export class EntityDefinition {
  /** @type {MetadataSchema} */
  #metadata = null
  #fields = null

  /***
   * @param metadata {MetadataSchema} the metadata to be associated with the entity
   */
  constructor (metadata) {
    const validation = metadataSchema.validate(metadata)
    if (validation.error) throw validation.error
    this.#metadata = metadata
    this.#fields = Object.values(metadata.mappings)
      .map(({ field }) => field)
      .filter(field => !field.includes('@'))
  }

  /**
   * @returns {!string} the entity collection name used locally
   */
  get localCollection () {
    return this.#metadata.localCollection
  }

  /**
   * @returns {!string} the entity collection name used by dynamics
   */
  get dynamicsCollection () {
    return this.#metadata.dynamicsCollection
  }

  /**
   * @returns {string} the default filter string used in any request to dynamics
   */
  get defaultFilter () {
    return this.#metadata.defaultFilter
  }

  /**
   * @returns {Object} the field mappings used to map between the dynamics entity and the local entity
   */
  get mappings () {
    return this.#metadata.mappings
  }

  /**
   * @returns {Array<String>} the fields used to populate the select statement in any retrieve request to dynamics
   */
  get select () {
    return this.#fields
  }

  /**
   * Builds a request object to be used with the the dynamics-web-api package
   * as per {@link https://www.npmjs.com/package/dynamics-web-api#advanced-using-request-object-4}
   *
   * @param filterString an optional filter string to use, otherwise defaults to the defaultFilter configured for the entity
   * @returns {{filter: string, select: Array<String>, collection: !string}}
   */
  toRetrieveRequest (filterString = this.defaultFilter) {
    return {
      collection: this.dynamicsCollection,
      select: this.select,
      filter: filterString
    }
  }
}
