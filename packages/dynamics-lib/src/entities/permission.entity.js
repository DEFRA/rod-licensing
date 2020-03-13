import { BaseEntity, EntityDefinition } from './base.entity.js'
export class Permission extends BaseEntity {
  static #definition = new EntityDefinition({
    collection: 'defra_permissions',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_permissionid', type: 'string' },
      referenceNumber: { field: 'defra_name', type: 'string' },
      issueDate: { field: 'defra_issuedate', type: 'datetime' },
      startDate: { field: 'defra_startdate', type: 'datetime' },
      endDate: { field: 'defra_enddate', type: 'datetime' },
      stagingId: { field: 'defra_stagingid', type: 'string' },
      dataSource: { field: 'defra_datasource', type: 'optionset', ref: 'defra_datasource' }
    }
  })

  /** Define mappings between Dynamics entity field and local entity field */
  static get definition () {
    return Permission.#definition
  }

  /** get the referenceNumber of the entity */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  /** set the referenceNumber of this entity */
  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /** get the issueDate of the entity */
  get issueDate () {
    return super._getState('issueDate')
  }

  /** set the issueDate of this entity */
  set issueDate (issueDate) {
    super._setState('issueDate', issueDate)
  }

  /** get the startDate of the entity */
  get startDate () {
    return super._getState('startDate')
  }

  /** set the startDate of this entity */
  set startDate (startDate) {
    super._setState('startDate', startDate)
  }

  /** get the endDate of the entity */
  get endDate () {
    return super._getState('endDate')
  }

  /** set the endDate of this entity */
  set endDate (endDate) {
    super._setState('endDate', endDate)
  }

  /** get the dataSource of the entity */
  get dataSource () {
    return super._getState('dataSource')
  }

  /** set the dataSource of this entity */
  set dataSource (dataSource) {
    super._setState('dataSource', dataSource)
  }

  /** get the stagingId of the entity */
  get stagingId () {
    return super._getState('stagingId')
  }

  /** set the stagingId of this entity */
  set stagingId (stagingId) {
    super._setState('stagingId', stagingId)
  }

  bindToPermit (permit) {
    super._bind('defra_PermitId@odata.bind', permit)
  }

  bindToContact (contact) {
    super._bind('defra_ContactId@odata.bind', contact)
  }
}
