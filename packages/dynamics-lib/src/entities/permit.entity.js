import { BaseEntity, EntityDefinition } from './base.entity.js'

export class Permit extends BaseEntity {
  static #definition = new EntityDefinition({
    collection: 'defra_permits',
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
      itemId: { field: 'defra_itemid', type: 'integer' }
    }
  })

  /** Define mappings between Dynamics entity field and local entity field */
  static get definition () {
    return Permit.#definition
  }

  /** get the description of the entity */
  get description () {
    return super._getState('description')
  }

  /** get the permitId of the entity */
  get permitId () {
    return super._getState('permitId')
  }

  /** get the permitType of the entity */
  get permitType () {
    return super._getState('permitType')
  }

  /** get the permitSubtype of the entity */
  get permitSubtype () {
    return super._getState('permitSubtype')
  }

  /** get the duration of the entity */
  get duration () {
    return super._getState('duration')
  }

  /** get the durationMagnitude of the entity */
  get durationMagnitude () {
    return super._getState('durationMagnitude')
  }

  /** get the durationDesignator of the entity */
  get durationDesignator () {
    return super._getState('durationDesignator')
  }

  /** get the equipment of the entity */
  get equipment () {
    return super._getState('equipment')
  }

  /** get the equipment of the entity */
  get numberOfRods () {
    return super._getState('numberOfRods')
  }

  /** get the availableFrom of the entity */
  get availableFrom () {
    return super._getState('availableFrom')
  }

  /** get the availableTo of the entity */
  get availableTo () {
    return super._getState('availableTo')
  }

  /** get the isforfulfilment of the entity */
  get isForFulfilment () {
    return super._getState('isForFulfilment')
  }

  /** get the iscountersales of the entity */
  get isCounterSales () {
    return super._getState('isCounterSales')
  }

  /** get the cost of the entity */
  get cost () {
    return super._getState('cost')
  }

  /** get the itemId of the entity */
  get itemId () {
    return super._getState('itemId')
  }
}
