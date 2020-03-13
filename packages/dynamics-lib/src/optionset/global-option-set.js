import util from 'util'

export default class GlobalOptionSetEntry {
  constructor (optionSetName, { id, label, description }) {
    this._optionSetName = optionSetName
    this._properties = {
      id: id,
      label: label,
      description: description
    }
    this[util.inspect.custom] = this.toJSON
  }

  get optionSetName () {
    return this._optionSetName
  }

  get id () {
    return this._properties.id
  }

  get label () {
    return this._properties.label
  }

  get description () {
    return this._properties.description
  }

  /**
   * @returns {{}} a json representation of the optionset
   */
  toJSON () {
    return this._properties
  }
}
