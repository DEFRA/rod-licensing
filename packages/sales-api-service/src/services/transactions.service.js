import {
  persist,
  Permission,
  Permit,
  Concession,
  ConcessionProof,
  FulfilmentRequest,
  Transaction,
  TransactionCurrency,
  TransactionJournal
} from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntityAndId, getGlobalOptionSetValue, getReferenceDataForEntity } from './reference-data.service.js'
import { calculateEndDate, generatePermissionNumber } from './permissions.service.js'
import { resolveContactPayload } from './contacts.service.js'
import Boom from '@hapi/boom'
import uuid from 'uuid/v4.js'
import AWS from './aws.js'
import db from 'debug'
const { sqs, docClient } = AWS()
const debug = db('sales:transactions')
const STAGING_TTL_DELTA = process.env.TRANSACTION_STAGING_TABLE_TTL || 60 * 60 * 24
const STAGING_HISTORY_TTL_DELTA = process.env.TRANSACTION_STAGING_HISTORY_TABLE_TTL || 60 * 60 * 24 * 28

export async function newTransaction (payload) {
  const transactionId = uuid()
  debug('Creating new transaction %s', transactionId)
  const record = {
    id: transactionId,
    expires: Math.floor(Date.now() / 1000) + STAGING_TTL_DELTA,
    ...payload
  }

  // Generate derived fields
  for (const permission of record.permissions) {
    permission.referenceNumber = await generatePermissionNumber(permission, payload.dataSource)
    permission.endDate = await calculateEndDate(permission)
  }

  await docClient
    .put({ TableName: process.env.TRANSACTIONS_STAGING_TABLE, Item: record, ConditionExpression: 'attribute_not_exists(id)' })
    .promise()

  debug('Transaction %s stored with payload %O', transactionId, record)
  return record
}

export async function completeTransaction ({ id, ...payload }) {
  try {
    debug('Received request to complete transaction %s with payload %O', id, payload)
    const setFieldExpression = Object.keys(payload)
      .map(k => `${k} = :${k}`)
      .join(', ')
    const expressionAttributeValues = Object.entries(payload).reduce((acc, [k, v]) => ({ ...acc, [`:${k}`]: v }), {})

    const transactionRecord = await docClient
      .update({
        TableName: process.env.TRANSACTIONS_STAGING_TABLE,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: `SET ${setFieldExpression}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      })
      .promise()
    debug('Updated transaction record for identifier %s: %O', id, transactionRecord.Attributes)

    const receipt = await sqs
      .sendMessage({
        QueueUrl: process.env.TRANSACTIONS_QUEUE_URL,
        MessageGroupId: 'transactions',
        MessageDeduplicationId: id,
        MessageBody: JSON.stringify({ id })
      })
      .promise()

    debug('Sent transaction %s to staging queue with message-id %s', id, receipt.MessageId)
    return receipt.MessageId
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') {
      debug('Transaction for identifier %s was not found', id)
      throw Boom.notFound('A transaction for the specified identifier was not found')
    }
    throw e
  }
}

export async function processQueue ({ id }) {
  debug('Processing message from queue for staging id %s', id)
  const entities = []
  const transactionRecord = await retrieveTransaction(id)
  debug('Retrieved transaction record for staging id %s: %O', id, transactionRecord)

  // Currently only a single currency (GBP) is supported
  const transactionCurrency = (await getReferenceDataForEntity(TransactionCurrency))[0]
  let totalTransactionValue = 0.0

  const transaction = new Transaction()
  transaction.referenceNumber = transactionRecord.id
  transaction.description = `Transaction for ${transactionRecord.permissions.length} permission(s) recorded on ${transactionRecord.paymentTimestamp}`
  transaction.timestamp = transactionRecord.paymentTimestamp
  transaction.source = await getGlobalOptionSetValue('defra_financialtransactionsource', transactionRecord.paymentSource)
  transaction.paymentType = await getGlobalOptionSetValue('defra_paymenttype', transactionRecord.paymentMethod)
  transaction.bindToTransactionCurrency(transactionCurrency)

  const chargeJournal = new TransactionJournal()
  chargeJournal.referenceNumber = transactionRecord.id
  chargeJournal.description = `Charge for ${transactionRecord.permissions.length} permission(s) recorded on ${transactionRecord.paymentTimestamp}`
  chargeJournal.timestamp = transactionRecord.paymentTimestamp
  chargeJournal.type = await getGlobalOptionSetValue('defra_financialtransactiontype', 'Charge')
  chargeJournal.bindToTransactionCurrency(transactionCurrency)
  chargeJournal.bindToTransaction(transaction)

  const paymentJournal = new TransactionJournal()
  paymentJournal.referenceNumber = transactionRecord.id
  paymentJournal.description = `Payment for ${transactionRecord.permissions.length} permission(s) recorded on ${transactionRecord.paymentTimestamp}`
  paymentJournal.timestamp = transactionRecord.paymentTimestamp
  paymentJournal.type = await getGlobalOptionSetValue('defra_financialtransactiontype', 'Payment')
  paymentJournal.bindToTransactionCurrency(transactionCurrency)
  paymentJournal.bindToTransaction(transaction)

  entities.push(transaction, chargeJournal, paymentJournal)

  const dataSourceOptionValue = await getGlobalOptionSetValue('defra_datasource', transactionRecord.dataSource)
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
    permission.dataSource = dataSourceOptionValue

    permission.bindToContact(contact)
    permission.bindToPermit(permit)
    permission.bindToTransaction(transaction)

    entities.push(contact, permission)

    if (concession) {
      const proof = new ConcessionProof()
      const concessionEntity = await getReferenceDataForEntityAndId(Concession, concession.concessionId)
      proof.proofType = await getGlobalOptionSetValue('defra_concessionproof', concession.proof.type)
      proof.referenceNumber = concession.proof.referenceNumber

      proof.bindToPermission(permission)
      proof.bindToConcession(concessionEntity)
      entities.push(proof)
    }

    if (permit.isForFulfilment) {
      const today = new Date()
      const refNumberExt = permission.referenceNumber.substring(permission.referenceNumber.lastIndexOf('-'))
      const fulfilmentRequest = new FulfilmentRequest()
      fulfilmentRequest.referenceNumber = today.toISOString() + refNumberExt
      fulfilmentRequest.requestTimestamp = today
      fulfilmentRequest.status = await getGlobalOptionSetValue('defra_fulfilmentrequeststatus', 'Pending')
      fulfilmentRequest.bindToPermission(permission)
      entities.push(fulfilmentRequest)
    }
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

export async function processDlq ({ id }) {
  console.log('Processed message from dlq with payload', id)
  // TODO: Implement
}

const retrieveTransaction = async id => {
  const result = await docClient.get({ TableName: process.env.TRANSACTIONS_STAGING_TABLE, Key: { id }, ConsistentRead: true }).promise()
  const record = result.Item
  if (!record) {
    debug('Failed to retrieve a transaction with staging id %s', id)
    throw Boom.notFound('A transaction for the specified identifier was not found')
  }
  debug('Retrieved record for message with staging id %s: %O', id, record)
  return record
}
