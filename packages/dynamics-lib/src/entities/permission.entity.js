import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Permission entity
 * @extends BaseEntity
 */
export class Permission extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition({
    localCollection: 'permissions',
    dynamicsCollection: 'defra_permissions',
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

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return Permission._definition
  }

  /**
   * The reference number associated with the permission
   * @type {string}
   */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /**
   * The issue date associated with the permission
   * @type {string|Date}
   */
  get issueDate () {
    return super._getState('issueDate')
  }

  set issueDate (issueDate) {
    super._setState('issueDate', issueDate)
  }

  /**
   * The start date associated with the permission
   * @type {string|Date}
   */
  get startDate () {
    return super._getState('startDate')
  }

  set startDate (startDate) {
    super._setState('startDate', startDate)
  }

  /**
   * The end date associated with the permission
   * @type {string|Date}
   */
  get endDate () {
    return super._getState('endDate')
  }

  set endDate (endDate) {
    super._setState('endDate', endDate)
  }

  /**
   * The data source associated with the permission
   * @type {Object<GlobalOptionSetDefinition>}
   */
  get dataSource () {
    return super._getState('dataSource')
  }

  set dataSource (dataSource) {
    super._setState('dataSource', dataSource)
  }

  /**
   * The staging identifier associated with the permission
   * @type {string}
   */
  get stagingId () {
    return super._getState('stagingId')
  }

  set stagingId (stagingId) {
    super._setState('stagingId', stagingId)
  }

  /**
   * Associate the permission with a {@link Permit}
   * @param {Permit} permit the {@link Permit} with which to create an association
   */
  bindToPermit (permit) {
    super._bind('defra_PermitId@odata.bind', permit)
  }

  /**
   * Associate the permission with a {@link Contact}
   * @param {Contact} contact the {@link Contact} with which to create an association
   */
  bindToContact (contact) {
    super._bind('defra_ContactId@odata.bind', contact)
  }
}
