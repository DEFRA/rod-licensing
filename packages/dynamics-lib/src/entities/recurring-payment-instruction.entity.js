import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Recurring payment instruction entity
 * @extends BaseEntity
 */
export class RecurringPaymentInstruction extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition({
    localCollection: 'recurringPaymentInstructions',
    dynamicsCollection: 'defra_recurringpaymentinstructions',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_recurringpaymentinstructionid', type: 'string' }
    }
  })

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return RecurringPaymentInstruction._definition
  }

  /**
   * Associate the recurring payment instruction with a {@link RecurringPayment}
   *
   * @param {RecurringPayment} recurringPayment the {@link RecurringPayment} with which to create an association
   */
  bindToRecurringPayment (recurringPayment) {
    super._bind('defra_RecurringPayment@odata.bind', recurringPayment)
  }

  /**
   * Associate the recurring payment instruction with a {@link Permit}
   *
   * @param {Permit} permit the {@link Permit} with which to create an association
   */
  bindToPermit (permit) {
    super._bind('defra_Permit@odata.bind', permit)
  }

  /**
   * Associate the recurring payment instruction with a {@link Contact}.  This is the contact details relating angler who will receive a new licence
   *
   * @param {Contact} contact the {@link Contact} with which to create an association
   */
  bindToContact (contact) {
    super._bind('defra_Contact@odata.bind', contact)
  }
}
