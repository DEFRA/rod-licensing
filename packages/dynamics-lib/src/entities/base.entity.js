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
  _etag = null
  _contentId = uuidv4()
  _localState = {}
  _bindings = {}

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
    return this._etag === null
  }

  /**
   * the etag of the entity or null if not yet persisted
   * @readonly
   * @returns {string}
   */
  get etag () {
    return this._etag
  }

  /**
   * Retrieve the state of an entity field
   *
   * @param property the field name
   * @returns {*} the value of the field
   * @protected
   */
  _getState (property) {
    return this._localState[property]
  }

  /**
   * Set the state of an entity field
   *
   * @param property the field name
   * @param value the value of the field to set
   * @protected
   */
  _setState (property, value) {
    const mapping = this.constructor.definition.mappings[property]
    if (!mapping) {
      throw new Error('Unrecognised property mapping')
    }
    if (value !== undefined && value !== null) {
      const setOp = {
        string: this._setString,
        integer: this._setInteger,
        decimal: this._setDecimal,
        boolean: this._setBoolean,
        date: this._setDate,
        datetime: this._setDate,
        optionset: this._setOptionSet
      }
      setOp[mapping.type].bind(this)(property, value)
    } else {
      this._localState[property] = value
    }
  }

  /**
   * Set a field value as a string
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setString (property, value) {
    this._localState[property] = String(value)
  }

  /**
   * Set a field value as an integer
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setInteger (property, value) {
    const valueToSet = Number(value)
    if (Number.isNaN(valueToSet) || valueToSet - Math.floor(valueToSet) !== 0) {
      throw new Error('Value is not an integer')
    }
    this._localState[property] = valueToSet
  }

  /**
   * Set a field value as a decimal
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setDecimal (property, value) {
    const valueToSet = Number(value)
    if (Number.isNaN(valueToSet)) {
      throw new Error('Value is not an decimal')
    }
    this._localState[property] = valueToSet
  }

  /**
   * Set a field value as a boolean
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setBoolean (property, value) {
    if (value !== false && value !== true) {
      throw new Error('Value is not an boolean')
    }
    this._localState[property] = value
  }

  /**
   * Set a field value as a date
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setDate (property, value) {
    if (!moment(value).isValid()) {
      throw new Error('Value is not a valid date')
    }
    this._localState[property] = value
  }

  /**
   * Set a field value as a GlobalOptionSetDefinition
   *
   * @param property the field name
   * @param value the value of the field to set
   * @private
   */
  _setOptionSet (property, value) {
    const mapping = this.constructor.definition.mappings[property]
    if (!(value instanceof GlobalOptionSetDefinition) || value.optionSetName !== mapping.ref) {
      throw new Error('Value is not a valid GlobalOptionSetDefinition')
    }
    this._localState[property] = value
  }

  /**
   * Serialize an entity property into the format suitable for a Dynamics request
   *
   * @param property the field name
   * @returns {*} the value that is set
   * @protected
   */
  _toSerialized (property) {
    let value = this._localState[property]
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
   * @param {string} property the binding to use including the @odata.bind directive
   * @param {BaseEntity} entity the entity instance to bind to
   * @returns {*}
   * @protected
   */
  _bind (property, entity) {
    if (!entity) {
      throw new Error(`Unable to bind ${this.constructor.definition.localCollection}.${property}, to an undefined or null entity`)
    }
    this._bindings[property] = entity
  }

  /**
   * a unique (uuid) identifier for this object instance (useful for batch creation requests)
   * @type {string}
   * @readonly
   */
  get uniqueContentId () {
    return this._contentId
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
    // Stringify and parse to recursively call toJSON() on child objects
    return JSON.parse(JSON.stringify(this._localState))
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
        Object.entries(this._bindings).reduce((acc, [k, v]) => {
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
   * @param {Object} optionSetData the global option set data used to resolve option set fields
   * @returns {BaseEntity} an instance of a BaseEntity subclass
   */
  static fromResponse ({ '@odata.etag': etag, ...fields }, optionSetData) {
    const instance = new this.prototype.constructor()
    instance._etag = etag
    instance._localState = Object.entries(this.definition.mappings)
      .filter(([property, { field }]) => fields[field] !== undefined)
      .reduce((acc, [property, { field, type, ref }]) => {
        let value = fields[field]
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
  _metadata
  _fields

  /***
   * @param metadata {MetadataSchema} the metadata to be associated with the entity
   */
  constructor (metadata) {
    const validation = metadataSchema.validate(metadata)
    if (validation.error) {
      throw validation.error
    }
    this._metadata = metadata
    this._fields = Object.values(metadata.mappings)
      .map(({ field }) => field)
      .filter(field => !field.includes('@'))
  }

  /**
   * @returns {!string} the entity collection name used locally
   */
  get localCollection () {
    return this._metadata.localCollection
  }

  /**
   * @returns {!string} the entity collection name used by dynamics
   */
  get dynamicsCollection () {
    return this._metadata.dynamicsCollection
  }

  /**
   * @returns {string} the default filter string used in any request to dynamics
   */
  get defaultFilter () {
    return this._metadata.defaultFilter
  }

  /**
   * @returns {Object} the field mappings used to map between the dynamics entity and the local entity
   */
  get mappings () {
    return this._metadata.mappings
  }

  /**
   * @returns {Array<String>} the fields used to populate the select statement in any retrieve request to dynamics
   */
  get select () {
    return this._fields
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
      ...(filterString && { filter: filterString })
    }
  }
}
