import { BaseEntity, EntityDefinition } from './base.entity.js'

export class Permit extends BaseEntity {
  static #definition = new EntityDefinition({
    collection: 'defra_permits',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_permitid' },
      description: { field: 'defra_name' },
      permitId: { field: 'defra_permitid' },
      permitTypeId: { field: 'defra_permittype' },
      permitType: {
        field: 'defra_permittype@OData.Community.Display.V1.FormattedValue'
      },
      permitSubtypeId: { field: 'defra_permitsubtype' },
      permitSubtype: {
        field: 'defra_permitsubtype@OData.Community.Display.V1.FormattedValue'
      },
      durationId: { field: 'defra_duration' },
      duration: {
        field: 'defra_duration@OData.Community.Display.V1.FormattedValue'
      },
      equipmentId: { field: 'defra_equipment' },
      equipment: {
        field: 'defra_equipment@OData.Community.Display.V1.FormattedValue'
      },
      availableFrom: { field: 'defra_availablefrom' },
      availableTo: { field: 'defra_availableto' },
      isForFulfilment: { field: 'defra_isforfulfilment' },
      isCounterSales: { field: 'defra_iscountersales' },
      cost: { field: 'defra_advertisedprice' },
      itemId: { field: 'defra_itemid' }
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

  /** get the permitTypeId of the entity */
  get permitTypeId () {
    return super._getState('permitTypeId')
  }

  /** get the permitType of the entity */
  get permitType () {
    return super._getState('permitType')
  }

  /** get the permitSubtypeId of the entity */
  get permitSubtypeId () {
    return super._getState('permitSubtypeId')
  }

  /** get the permitSubtype of the entity */
  get permitSubtype () {
    return super._getState('permitSubtype')
  }

  /** get the durationId of the entity */
  get durationId () {
    return super._getState('durationId')
  }

  /** get the duration of the entity */
  get duration () {
    return super._getState('duration')
  }

  /** get the equipmentId of the entity */
  get equipmentId () {
    return super._getState('equipmentId')
  }

  /** get the equipment of the entity */
  get equipment () {
    return super._getState('equipment')
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
