import { BaseEntity, EntityDefinition } from './base.entity.js'
import { Contact } from './contact.entity.js'
import { Permission } from './permission.entity.js'

/**
 * Recurring payment entity
 * @extends BaseEntity
 */
export class RecurringPayment extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'recurringPayment',
    dynamicsCollection: 'defra_recurringpayments',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_recurringpaymentid', type: 'string' },
      name: { field: 'defra_name', type: 'string' },
      status: { field: 'statecode', type: 'decimal' },
      nextDueDate: { field: 'defra_nextduedate', type: 'datetime' },
      cancelledDate: { field: 'defra_cancelleddate', type: 'datetime' },
      cancelledReason: { field: 'defra_cancelledreason', type: 'optionset', ref: 'defra_cancelledreason' },
      endDate: { field: 'defra_enddate', type: 'datetime' },
      agreementId: { field: 'defra_agreementid', type: 'string' },
      publicId: { field: 'defra_publicid', type: 'string' },
      lastDigitsCardNumbers: { field: 'defra_lastdigitscardnumbers', type: 'string' }
    },
    relationships: {
      contact: { property: 'defra_Contact', entity: Contact, parent: true },
      activePermission: { property: 'defra_ActivePermission', entity: Permission, parent: true },
      nextRecurringPayment: { property: 'defra_NextRecurringPayment', entity: RecurringPayment, parent: true }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return RecurringPayment._definition
  }

  /**
   * The default name associated with the recurring payment
   * @type {string}
   */
  get name () {
    return super._getState('name')
  }

  set name (name) {
    super._setState('name', name)
  }

  /**
   * The date the recurring payment is due
   * @type {datetime}
   */
  get nextDueDate () {
    return super._getState('nextDueDate')
  }

  set nextDueDate (nextDueDate) {
    super._setState('nextDueDate', nextDueDate)
  }

  /**
   * The date the recurring payment was cancelled
   * @type {datetime}
   */
  get cancelledDate () {
    return super._getState('cancelledDate')
  }

  set cancelledDate (cancelledDate) {
    super._setState('cancelledDate', cancelledDate)
  }

  /**
   * The reason the recurring payment was cancelled
   * @type {GlobalOptionSetDefinition}
   */
  get cancelledReason () {
    return super._getState('cancelledReason')
  }

  set cancelledReason (cancelledReason) {
    super._setState('cancelledReason', cancelledReason)
  }

  /**
   * The end of the recurring payment
   * @type {datetime}
   */
  get endDate () {
    return super._getState('endDate')
  }

  set endDate (endDate) {
    super._setState('endDate', endDate)
  }

  /**
   * The agreement identification number
   * @type {string}
   */
  get agreementId () {
    return super._getState('agreementId')
  }

  set agreementId (agreementId) {
    super._setState('agreementId', agreementId)
  }

  /**
   * Hash of the id
   * @type {string}
   */
  get publicId () {
    return super._getState('publicId')
  }

  set publicId (publicId) {
    super._setState('publicId', publicId)
  }

  /**
   * The state code
   * @type {decimal}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }

  /**
   * Last four digits of card number
   * @type {string}
   */
  get lastDigitsCardNumbers () {
    return super._getState('lastDigitsCardNumbers')
  }

  set lastDigitsCardNumbers (lastDigitsCardNumbers) {
    super._setState('lastDigitsCardNumbers', lastDigitsCardNumbers)
  }
}
