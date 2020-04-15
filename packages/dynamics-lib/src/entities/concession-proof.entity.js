import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Concession proofs entity
 * @extends BaseEntity
 */
export class ConcessionProof extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition({
    localCollection: 'concessionProofs',
    dynamicsCollection: 'defra_concessionproofs',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_concessionproofid', type: 'string' },
      referenceNumber: { field: 'defra_referencenumber', type: 'string' },
      proofType: { field: 'defra_concessionprooftype', type: 'optionset', ref: 'defra_concessionproof' }
    }
  })

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return ConcessionProof._definition
  }

  /**
   * The reference number associated with the concession proof (e.g. blue badge number, NI number)
   * @type {string}
   */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /**
   * The type of the concession proof
   * @type {GlobalOptionSetDefinition}
   */
  get proofType () {
    return super._getState('proofType')
  }

  set proofType (proofType) {
    super._setState('proofType', proofType)
  }

  /**
   * Associate the concession proof with a {@link Concession}
   * @param {Concession} concession the {@link Concession} with which to create an association
   */
  bindToConcession (concession) {
    super._bind('defra_ConcessionNameId@odata.bind', concession)
  }

  /**
   * Associate the concession proof with a {@link Permission}
   * @param {Permission} permission the {@link Permission} with which to create an association
   */
  bindToPermission (permission) {
    super._bind('defra_PermissionId@odata.bind', permission)
  }
}
