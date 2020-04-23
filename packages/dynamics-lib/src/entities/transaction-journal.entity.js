import { BaseEntity, EntityDefinition } from './base.entity.js'

/**
 * Transaction Journal entity
 * @extends BaseEntity
 */
export class TransactionJournal extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition({
    localCollection: 'transactions',
    dynamicsCollection: 'defra_transactionjournals',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_transactionjournalid', type: 'string' },
      referenceNumber: { field: 'defra_name', type: 'string' },
      description: { field: 'defra_description', type: 'string' },
      timestamp: { field: 'defra_timestamp', type: 'datetime' },
      type: { field: 'defra_transactiontype', type: 'optionset', ref: 'defra_financialtransactiontype' },
      total: { field: 'defra_total', type: 'decimal' }
    }
  })

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return TransactionJournal._definition
  }

  /**
   * The reference number associated with the transaction journal entrys
   * @type {string}
   */
  get referenceNumber () {
    return super._getState('referenceNumber')
  }

  set referenceNumber (referenceNumber) {
    super._setState('referenceNumber', referenceNumber)
  }

  /**
   * The description associated with the transaction journal entry
   * @type {string}
   */
  get description () {
    return super._getState('description')
  }

  set description (description) {
    super._setState('description', description)
  }

  /**
   * The timestamp associated with the transaction journal entry
   * @type {string}
   */
  get timestamp () {
    return super._getState('timestamp')
  }

  set timestamp (timestamp) {
    super._setState('timestamp', timestamp)
  }

  /**
   * The type of the transaction journal entry
   * @type {Object<GlobalOptionSetDefinition>}
   */
  get type () {
    return super._getState('type')
  }

  set type (type) {
    super._setState('type', type)
  }

  /**
   * The total value of the transaction journal entry
   * @type {string}
   */
  get total () {
    return super._getState('total')
  }

  set total (total) {
    super._setState('total', total)
  }

  /**
   * Associate the transaction journal with a {@link TransactionCurrency}
   * @param {TransactionCurrency} currency the {@link TransactionCurrency} with which to create an association
   */
  bindToTransactionCurrency (currency) {
    super._bind('transactioncurrencyid@odata.bind', currency)
  }

  /**
   * Associate the transaction journal with a {@link Transaction}
   * @param {Transaction} transaction the {@link Transaction} with which to create an association
   */
  bindToTransaction (transaction) {
    super._bind('defra_Transaction@odata.bind', transaction)
  }
}
