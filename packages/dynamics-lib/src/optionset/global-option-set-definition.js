import util from 'util'

/**
 * A GlobalOptionSet definition
 * @class
 */
export class GlobalOptionSetDefinition {
  /**
   *
   * @param {string} optionSetName The collection name this global optionset
   * @param {string} id The ID of this option
   * @param {string} label The Label associated with this option
   * @param {string} description The description associated with this option
   */
  constructor (optionSetName, { id, label, description }) {
    this._optionSetName = optionSetName
    this._properties = {
      id: id,
      label: label,
      description: description
    }
    this[util.inspect.custom] = this.toJSON
  }

  /**
   * The collection name this global optionset
   * @type {string}
   * @readonly
   */
  get optionSetName () {
    return this._optionSetName
  }

  /**
   * The ID of this option
   * @type {string}
   * @readonly
   */
  get id () {
    return this._properties.id
  }

  /**
   * The Label associated with this option
   * @type {string}
   * @readonly
   */
  get label () {
    return this._properties.label
  }

  /**
   * The description associated with this option
   * @type {string}
   * @readonly
   */
  get description () {
    return this._properties.description
  }

  /**
   * @returns {{}} a json representation of the optionset
   */
  toJSON () {
    // Stringify and parse to recursively call toJSON() on child objects
    return JSON.parse(JSON.stringify(this._properties))
  }
}
