import { BaseEntity, EntityDefinition } from './base.entity.js'
export class Concession extends BaseEntity {
  static #definition = new EntityDefinition({
    collection: 'defra_concessions',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_concessionid', type: 'string' },
      name: { field: 'defra_name', type: 'string' }
    }
  })

  /** Define mappings between Dynamics entity field and local entity field */
  static get definition () {
    return Concession.#definition
  }

  /** get the name of the entity */
  get name () {
    return super._getState('name')
  }
}
