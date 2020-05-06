import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Recurring payment entity
 * @extends BaseEntity
 */
export class RecurringPayment extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition({
    localCollection: 'recurringPayments',
    dynamicsCollection: 'defra_recurringpayments',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_recurringpaymentid', type: 'string' },
      referenceNumber: { field: 'defra_name', type: 'string' },
      mandate: { field: 'defra_mandate', type: 'string' },
      inceptionDay: { field: 'defra_inceptionday', type: 'integer' },
      inceptionMonth: { field: 'defra_inceptionmonth', type: 'integer' }
    }
  })

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return RecurringPayment._definition
  }

  /**
   * The reference number associated with the recurring payment
   * @type {string}
   */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /**
   * The mandate identifier associated with the recurring payment
   * @type {string}
   */
  get mandate () {
    return super._getState('mandate')
  }

  set mandate (mandate) {
    super._setState('mandate', mandate)
  }

  /**
   * The inception day associated with the recurring payment
   * @type {integer}
   */
  get inceptionDay () {
    return super._getState('inceptionDay')
  }

  set inceptionDay (inceptionDay) {
    super._setState('inceptionDay', inceptionDay)
  }

  /**
   * The inception month associated with the recurring payment
   * Note: Months are zero indexed, so January is month 0.
   *
   * @type {integer}
   */
  get inceptionMonth () {
    return super._getState('inceptionMonth')
  }

  set inceptionMonth (inceptionMonth) {
    super._setState('inceptionMonth', inceptionMonth)
  }

  /**
   * Associate the recurring payment with a {@link Contact}.  This is the contact details relating to the person paying (not necessarily the angler)
   *
   * @param {Contact} contact the {@link Contact} with which to create an association
   */
  bindToContact (contact) {
    super._bind('defra_Contact@odata.bind', contact)
  }
}
