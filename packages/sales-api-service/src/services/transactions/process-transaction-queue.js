import {
  persist,
  Permission,
  Permit,
  Concession,
  ConcessionProof,
  FulfilmentRequest,
  Transaction,
  TransactionCurrency,
  TransactionJournal,
  RecurringPaymentInstruction
} from '@defra-fish/dynamics-lib'
import { DDE_DATA_SOURCE, FULFILMENT_SWITCHOVER_DATE, POCL_TRANSACTION_SOURCES } from '@defra-fish/business-rules-lib'
import { getReferenceDataForEntityAndId, getGlobalOptionSetValue, getReferenceDataForEntity } from '../reference-data.service.js'
import { processRecurringPayment } from '../recurring-payments.service.js'
import { resolveContactPayload } from '../contacts.service.js'
import { retrieveStagedTransaction } from './retrieve-transaction.js'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_STAGING_HISTORY_TABLE } from '../../config.js'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
import moment from 'moment'
const { docClient } = AWS()
const debug = db('sales:transactions')

/**
 * Process messages from the transactions queue
 *
 * The payload from the queue will just include an id which is used to retrieve the payload of the transaction from DynamoDB
 *
 * @param id
 * @returns {Promise<void>}
 */
export async function processQueue ({ id }) {
  debug('Processing message from queue for staging id %s', id)
  const entities = []
  const transactionRecord = await retrieveStagedTransaction(id)

  const { transaction, chargeJournal, paymentJournal } = await createTransactionEntities(transactionRecord)
  entities.push(transaction, chargeJournal, paymentJournal)

  const totalTransactionValue = transactionRecord.payment.amount
  const dataSource = await getGlobalOptionSetValue(Permission.definition.mappings.dataSource.ref, transactionRecord.dataSource)
  for (const {
    licensee,
    concessions,
    permitId,
    referenceNumber,
    issueDate,
    startDate,
    endDate,
    isRenewal,
    isLicenceForYou
  } of transactionRecord.permissions) {
    const permit = await getReferenceDataForEntityAndId(Permit, permitId)
    const contact = await resolveContactPayload(permit, licensee)

    const permission = await mapToPermission(
      referenceNumber,
      transactionRecord,
      issueDate,
      startDate,
      endDate,
      dataSource,
      isLicenceForYou,
      isRenewal
    )

    const { recurringPayment } = await processRecurringPayment(transactionRecord, contact)
    if (recurringPayment) {
      entities.push(recurringPayment)
    }

    permission.bindToEntity(Permission.definition.relationships.licensee, contact)
    permission.bindToEntity(Permission.definition.relationships.permit, permit)
    permission.bindToEntity(Permission.definition.relationships.transaction, transaction)
    transactionRecord.transactionFile &&
      permission.bindToAlternateKey(Permission.definition.relationships.poclFile, transactionRecord.transactionFile)

    entities.push(contact, permission)

    if (recurringPayment && permit.isRecurringPaymentSupported) {
      const paymentInstruction = new RecurringPaymentInstruction()
      paymentInstruction.bindToEntity(RecurringPaymentInstruction.definition.relationships.licensee, contact)
      paymentInstruction.bindToEntity(RecurringPaymentInstruction.definition.relationships.permit, permit)
      paymentInstruction.bindToEntity(RecurringPaymentInstruction.definition.relationships.recurringPayment, recurringPayment)
      entities.push(paymentInstruction)
    }

    for (const concession of concessions || []) {
      entities.push(await createConcessionProof(concession, permission))
    }

    if (shouldCreateFulfilmentRequest(permission, permit, contact)) {
      entities.push(await createFulfilmentRequest(permission))
    }
  }

  transaction.total = totalTransactionValue
  chargeJournal.total = -totalTransactionValue
  paymentJournal.total = totalTransactionValue

  debug('Persisting %d entities for staging id %s', entities.length, id)
  await persist(entities, transactionRecord.createdBy)
  debug('Moving staging data to history table for staging id %s', id)
  await docClient.delete({ TableName: TRANSACTION_STAGING_TABLE.TableName, Key: { id } })
  await docClient.put({
    TableName: TRANSACTION_STAGING_HISTORY_TABLE.TableName,
    Item: Object.assign(transactionRecord, { expires: Math.floor(Date.now() / 1000) + TRANSACTION_STAGING_HISTORY_TABLE.Ttl }),
    ConditionExpression: 'attribute_not_exists(id)'
  })
}

const shouldCreateFulfilmentRequest = (permission, permit, contact) => {
  const switchoverDate = new Date(process.env.FULFILMENT_SWITCHOVER_DATE || FULFILMENT_SWITCHOVER_DATE)
  return permit.isForFulfilment && contact.postalFulfilment && moment(permission.issueDate).isBefore(switchoverDate)
}

const mapToPermission = async (
  referenceNumber,
  transactionRecord,
  issueDate,
  startDate,
  endDate,
  dataSource,
  isLicenceForYou,
  isRenewal
) => {
  const permission = new Permission()
  permission.referenceNumber = referenceNumber
  permission.stagingId = transactionRecord.id
  permission.issueDate = issueDate
  permission.startDate = startDate
  permission.endDate = endDate
  permission.dataSource = dataSource
  permission.isRenewal = isRenewal
  if (isLicenceForYou !== null && isLicenceForYou !== undefined) {
    permission.isLicenceForYou = await getGlobalOptionSetValue(
      Permission.definition.mappings.isLicenceForYou.ref,
      isLicenceForYou ? 'Yes' : 'No'
    )
  }
  return permission
}

/**
 * Create transaction entities required to represent this transaction payload
 *
 * @param transactionRecord the transaction payload
 * @returns {Promise<{paymentJournal: TransactionJournal, chargeJournal: TransactionJournal, transaction: Transaction}>}
 */
const createTransactionEntities = async transactionRecord => {
  // Currently only a single currency (GBP) is supported
  const currency = (await getReferenceDataForEntity(TransactionCurrency))[0]

  const transaction = new Transaction()
  transaction.referenceNumber = transactionRecord.id
  transaction.description = `Transaction for ${transactionRecord.permissions.length} permission(s) recorded on ${transactionRecord.payment.timestamp}`
  transaction.timestamp = transactionRecord.payment.timestamp
  transaction.source = await getGlobalOptionSetValue(Transaction.definition.mappings.source.ref, transactionRecord.payment.source)
  transaction.paymentType = await getGlobalOptionSetValue(Transaction.definition.mappings.paymentType.ref, transactionRecord.payment.method)
  transaction.channelId = transactionRecord.channelId

  transaction.bindToEntity(Transaction.definition.relationships.transactionCurrency, currency)
  transactionRecord.transactionFile &&
    transaction.bindToAlternateKey(Transaction.definition.relationships.poclFile, transactionRecord.transactionFile)

  const chargeJournal = await createTransactionJournal(transactionRecord, transaction, 'Charge', currency)
  const paymentJournal = await createTransactionJournal(transactionRecord, transaction, 'Payment', currency)

  return { transaction, chargeJournal, paymentJournal }
}

export const getTransactionJournalRefNumber = (transactionRecord, type) => {
  if (POCL_TRANSACTION_SOURCES.includes(transactionRecord.dataSource) && type === 'Payment') {
    if (transactionRecord.dataSource === DDE_DATA_SOURCE && transactionRecord.journalId) {
      return `DDE-${new Date().getFullYear()}-${transactionRecord.journalId}`
    }
    return transactionRecord.serialNumber || transactionRecord.id
  }
  return transactionRecord.id
}

/**
 * Create a TransactionJournal entity for the given parameters
 *
 * @param {*} transactionRecord the transaction payload
 * @param {Transaction} transactionEntity the parent Transaction entity
 * @param {string} type the type of TransactionJournal to be created
 * @param {TransactionCurrency} currency the currency to be used
 * @returns {Promise<TransactionJournal>}
 */
const createTransactionJournal = async (transactionRecord, transactionEntity, type, currency) => {
  const journal = new TransactionJournal()
  journal.referenceNumber = getTransactionJournalRefNumber(transactionRecord, type)
  journal.description = `${type} for ${transactionRecord.permissions.length} permission(s) recorded on ${transactionRecord.payment.timestamp}`
  journal.timestamp = transactionRecord.payment.timestamp
  journal.type = await getGlobalOptionSetValue(TransactionJournal.definition.mappings.type.ref, type)
  journal.bindToEntity(TransactionJournal.definition.relationships.transaction, transactionEntity)
  journal.bindToEntity(TransactionJournal.definition.relationships.transactionCurrency, currency)
  return journal
}

/**
 * Create a fulfilment request
 *
 * @param permission
 * @returns {Promise<FulfilmentRequest>}
 */
const createFulfilmentRequest = async permission => {
  const today = new Date()
  const refNumberExt = permission.referenceNumber.substring(permission.referenceNumber.lastIndexOf('-'))
  const fulfilmentRequest = new FulfilmentRequest()
  fulfilmentRequest.referenceNumber = today.toISOString() + refNumberExt
  fulfilmentRequest.requestTimestamp = today
  fulfilmentRequest.status = await getGlobalOptionSetValue(FulfilmentRequest.definition.mappings.status.ref, 'Pending')
  fulfilmentRequest.notes = 'Initial fulfilment request created at point of sale'
  fulfilmentRequest.bindToEntity(FulfilmentRequest.definition.relationships.permission, permission)
  return fulfilmentRequest
}

/**
 * Create the necessary ConcessionProof entity for the given parameters
 *
 * @param concession
 * @param permission
 * @returns {Promise<ConcessionProof>}
 */
const createConcessionProof = async (concession, permission) => {
  const proof = new ConcessionProof()
  const concessionEntity = await getReferenceDataForEntityAndId(Concession, concession.id)
  proof.type = await getGlobalOptionSetValue(ConcessionProof.definition.mappings.type.ref, concession.proof.type)
  proof.referenceNumber = concession.proof.referenceNumber
  proof.bindToEntity(ConcessionProof.definition.relationships.permission, permission)
  proof.bindToEntity(ConcessionProof.definition.relationships.concession, concessionEntity)
  return proof
}
