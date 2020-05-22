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
  RecurringPayment,
  RecurringPaymentInstruction
} from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntityAndId, getGlobalOptionSetValue, getReferenceDataForEntity } from '../reference-data.service.js'
import { resolveContactPayload } from '../contacts.service.js'
import { retrieveStagedTransaction } from './retrieve-transaction.js'
import moment from 'moment'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
const { docClient } = AWS()
const debug = db('sales:transactions')
const STAGING_HISTORY_TTL_DELTA = process.env.TRANSACTION_STAGING_HISTORY_TABLE_TTL || 60 * 60 * 24 * 90

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

  const { recurringPayment, payer } = await processRecurringPayment(transactionRecord)
  recurringPayment && entities.push(recurringPayment, payer)

  let totalTransactionValue = 0.0
  const dataSource = await getGlobalOptionSetValue('defra_datasource', transactionRecord.dataSource)
  for (const { licensee, concession, permitId, referenceNumber, issueDate, startDate, endDate } of transactionRecord.permissions) {
    const contact = await resolveContactPayload(licensee)
    const permit = await getReferenceDataForEntityAndId(Permit, permitId)

    totalTransactionValue += permit.cost

    const permission = new Permission()
    permission.referenceNumber = referenceNumber
    permission.stagingId = transactionRecord.id
    permission.issueDate = issueDate
    permission.startDate = startDate
    permission.endDate = endDate
    permission.dataSource = dataSource

    permission.bindToContact(contact)
    permission.bindToPermit(permit)
    permission.bindToTransaction(transaction)

    entities.push(contact, permission)

    if (recurringPayment && permit.isRecurringPaymentSupported) {
      const paymentInstruction = new RecurringPaymentInstruction()
      paymentInstruction.bindToContact(contact)
      paymentInstruction.bindToPermit(permit)
      paymentInstruction.bindToRecurringPayment(recurringPayment)
      entities.push(paymentInstruction)
    }

    concession && entities.push(await createConcessionProof(concession, permission))
    permit.isForFulfilment && entities.push(await createFulfilmentRequest(permission))
  }

  transaction.total = totalTransactionValue
  chargeJournal.total = -totalTransactionValue
  paymentJournal.total = totalTransactionValue

  debug('Persisting entities for staging id %s: %O', id, entities)
  await persist(...entities)
  debug('Moving staging data to history table for staging id %s', id)
  await docClient.delete({ TableName: process.env.TRANSACTIONS_STAGING_TABLE, Key: { id } }).promise()
  await docClient
    .put({
      TableName: `${process.env.TRANSACTIONS_STAGING_TABLE}History`,
      Item: Object.assign(transactionRecord, { expires: Math.floor(Date.now() / 1000) + STAGING_HISTORY_TTL_DELTA }),
      ConditionExpression: 'attribute_not_exists(id)'
    })
    .promise()
}

/**
 * Process a recurring payment instruction
 * @param transactionRecord
 * @returns {Promise<{recurringPayment: null, payer: null}>}
 */
const processRecurringPayment = async transactionRecord => {
  let recurringPayment = null
  let payer = null
  if (transactionRecord.payment.recurring) {
    const inceptionMoment = moment(transactionRecord.payment.timestamp, true).utc()
    recurringPayment = new RecurringPayment()
    recurringPayment.referenceNumber = transactionRecord.payment.recurring.referenceNumber
    recurringPayment.mandate = transactionRecord.payment.recurring.mandate
    recurringPayment.inceptionDay = inceptionMoment.date()
    recurringPayment.inceptionMonth = inceptionMoment.month()
    payer = await resolveContactPayload(transactionRecord.payment.recurring.payer)
    recurringPayment.bindToContact(payer)
  }
  return { recurringPayment, payer }
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
  transaction.source = await getGlobalOptionSetValue('defra_financialtransactionsource', transactionRecord.payment.source)
  transaction.paymentType = await getGlobalOptionSetValue('defra_paymenttype', transactionRecord.payment.method)
  transaction.channelId = transactionRecord.channelId
  transaction.bindToTransactionCurrency(currency)

  const chargeJournal = await createTransactionJournal(transactionRecord, transaction, 'Charge', currency)
  const paymentJournal = await createTransactionJournal(transactionRecord, transaction, 'Payment', currency)

  return { transaction, chargeJournal, paymentJournal }
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
  journal.referenceNumber = transactionRecord.id
  journal.description = `${type} for ${transactionRecord.permissions.length} permission(s) recorded on ${transactionRecord.payment.timestamp}`
  journal.timestamp = transactionRecord.payment.timestamp
  journal.type = await getGlobalOptionSetValue('defra_financialtransactiontype', type)
  journal.bindToTransactionCurrency(currency)
  journal.bindToTransaction(transactionEntity)
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
  fulfilmentRequest.status = await getGlobalOptionSetValue('defra_fulfilmentrequeststatus', 'Pending')
  fulfilmentRequest.bindToPermission(permission)
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
  const concessionEntity = await getReferenceDataForEntityAndId(Concession, concession.concessionId)
  proof.proofType = await getGlobalOptionSetValue('defra_concessionproof', concession.proof.type)
  proof.referenceNumber = concession.proof.referenceNumber
  proof.bindToPermission(permission)
  proof.bindToConcession(concessionEntity)
  return proof
}
