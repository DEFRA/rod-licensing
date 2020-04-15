import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Permit entity
 * @extends BaseEntity
 */
export class Permit extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition({
    localCollection: 'permits',
    dynamicsCollection: 'defra_permits',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_permitid', type: 'string' },
      description: { field: 'defra_name', type: 'string' },
      permitId: { field: 'defra_permitid', type: 'string' },
      permitType: { field: 'defra_permittype', type: 'optionset', ref: 'defra_permittype' },
      permitSubtype: { field: 'defra_permitsubtype', type: 'optionset', ref: 'defra_permitsubtype' },
      duration: { field: 'defra_duration', type: 'optionset', ref: 'defra_duration' },
      durationMagnitude: { field: 'defra_durationnumericpart', type: 'integer' },
      durationDesignator: { field: 'defra_durationdaymonthyearpart', type: 'optionset', ref: 'defra_daymonthyear' },
      equipment: { field: 'defra_equipment', type: 'optionset', ref: 'defra_equipment' },
      numberOfRods: { field: 'defra_numberofrods', type: 'integer' },
      availableFrom: { field: 'defra_availablefrom', type: 'datetime' },
      availableTo: { field: 'defra_availableto', type: 'datetime' },
      isForFulfilment: { field: 'defra_isforfulfilment', type: 'boolean' },
      isCounterSales: { field: 'defra_iscountersales', type: 'boolean' },
      cost: { field: 'defra_advertisedprice', type: 'decimal' },
      itemId: { field: 'defra_itemid', type: 'string' }
    }
  })

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return Permit._definition
  }

  /**
   * The description of the permit
   * @type {string}
   * @readonly
   */
  get description () {
    return super._getState('description')
  }

  /**
   * The id of the permit
   * @type {string}
   * @readonly
   */
  get permitId () {
    return super._getState('permitId')
  }

  /**
   * The type of the permit
   * @type {GlobalOptionSetDefinition}
   * @readonly
   */
  get permitType () {
    return super._getState('permitType')
  }

  /**
   * The subtype of the permit
   * @type {GlobalOptionSetDefinition}
   * @readonly
   */
  get permitSubtype () {
    return super._getState('permitSubtype')
  }

  /**
   * The duration of the permit
   * @type {GlobalOptionSetDefinition}
   * @readonly
   */
  get duration () {
    return super._getState('duration')
  }

  /**
   * The duration magnitude of the permit
   * @type {number}
   * @readonly
   */
  get durationMagnitude () {
    return super._getState('durationMagnitude')
  }

  /**
   * The duration designator of the permit
   * @type {GlobalOptionSetDefinition}
   * @readonly
   */
  get durationDesignator () {
    return super._getState('durationDesignator')
  }

  /**
   * The equipment type of the permit
   * @type {GlobalOptionSetDefinition}
   * @readonly
   */
  get equipment () {
    return super._getState('equipment')
  }

  /**
   * The number of rods associated with the permit
   * @type {number}
   * @readonly
   */
  get numberOfRods () {
    return super._getState('numberOfRods')
  }

  /**
   * The date from which the permit is available
   * @type {string}
   * @readonly
   */
  get availableFrom () {
    return super._getState('availableFrom')
  }

  /**
   * The date to which the permit is available
   * @type {string}
   * @readonly
   */
  get availableTo () {
    return super._getState('availableTo')
  }

  /**
   * Whether this type of permit will require fulfilment
   * @type {boolean}
   * @readonly
   */
  get isForFulfilment () {
    return super._getState('isForFulfilment')
  }

  /**
   * Whether this type of permit is allowed for counter sales
   * @type {boolean}
   * @readonly
   */
  get isCounterSales () {
    return super._getState('isCounterSales')
  }

  /**
   * The cost of permissions associated with this permit
   * @type {number}
   * @readonly
   */
  get cost () {
    return super._getState('cost')
  }

  /**
   * The POCL itemId associated with this permit
   * @type {number}
   * @readonly
   */
  get itemId () {
    return super._getState('itemId')
  }
}
