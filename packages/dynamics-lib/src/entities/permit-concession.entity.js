import { BaseEntity, EntityDefinition } from './base.entity.js'
export class PermitConcession extends BaseEntity {
  static #definition = new EntityDefinition({
    collection: 'defra_defra_concession_defra_permitset',
    defaultFilter: undefined,
    mappings: {
      id: { field: 'defra_defra_concession_defra_permitid', type: 'string' },
      concessionId: { field: 'defra_concessionid', type: 'string' },
      permitId: { field: 'defra_permitid', type: 'string' }
    }
  })

  /** Define mappings between Dynamics entity field and local entity field */
  static get definition () {
    return PermitConcession.#definition
  }

  /** get the concessionId of the entity */
  get concessionId () {
    return super._getState('concessionId')
  }

  /** get the permitId of the entity */
  get permitId () {
    return super._getState('permitId')
  }
}
