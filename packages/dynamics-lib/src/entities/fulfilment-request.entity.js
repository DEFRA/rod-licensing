import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Fulfilment requests entity
 * @extends BaseEntity
 */
export class FulfilmentRequest extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition({
    localCollection: 'fulfilmentRequests',
    dynamicsCollection: 'defra_fulfilmentrequests',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_fulfilmentrequestid', type: 'string' },
      referenceNumber: { field: 'defra_name', type: 'string' },
      requestTimestamp: { field: 'defra_requesttimestamp', type: 'datetime' },
      notes: { field: 'defra_notes', type: 'string' },
      status: { field: 'defra_status', type: 'optionset', ref: 'defra_fulfilmentrequeststatus' }
    }
  })

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return FulfilmentRequest._definition
  }

  /**
   * The reference number associated with the fulfilment request
   * @type {string}
   */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /**
   * The timestamp of the fulfilment request
   * @type {date|string}
   */
  get requestTimestamp () {
    return super._getState('requestTimestamp')
  }

  set requestTimestamp (requestTimestamp) {
    super._setState('requestTimestamp', requestTimestamp)
  }

  /**
   * Any notes associated with the fulfilment request
   * @type {string}
   */
  get notes () {
    return super._getState('notes')
  }

  set notes (notes) {
    super._setState('notes', notes)
  }

  /**
   * The status of the fulfilment request
   * @type {GlobalOptionSetDefinition}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }

  /**
   * Associate the fulfilment request with a {@link FulfilmentRequestFile}
   * @param {FulfilmentRequestFile} fulfilmentRequestFile the {@link FulfilmentRequestFile} with which to create an association
   */
  bindToFulfilmentRequestFile (fulfilmentRequestFile) {
    super._bind('defra_FulfilmentRequestFileId@odata.bind', fulfilmentRequestFile)
  }

  /**
   * Associate the fulfilment request with a {@link Permission}
   * @param {Permission} permission the {@link Permission} with which to create an association
   */
  bindToPermission (permission) {
    super._bind('defra_PermissionId@odata.bind', permission)
  }
}
