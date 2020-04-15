import { Permission, Permit, Concession, ConcessionProof, FulfilmentRequest, persist } from '@defra-fish/dynamics-lib'
import { getReferenceDataForEntityAndId, getGlobalOptionSetValue } from './reference-data.service.js'
import { calculateEndDate, generatePermissionNumber } from './permissions.service.js'
import { resolveContactPayload } from './contacts.service.js'
import Boom from '@hapi/boom'
import uuid from 'uuid/v4.js'
import AWS from './aws.js'
import db from 'debug'
const { sqs, docClient } = AWS()
const debug = db('sales:transactions')
const TTL_DELTA = process.env.TRANSACTION_STAGING_TABLE_TTL || 60 * 60 * 24

export async function newTransaction (payload) {
  const transactionId = uuid()
  debug('Creating new transaction %s', transactionId)
  const record = {
    id: transactionId,
    expires: Math.floor(Date.now() / 1000) + TTL_DELTA,
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
  debug('Received request to complete transaction %s with payload %O', id, payload)
  await retrieveTransaction(id)

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
}

export async function processQueue ({ id }) {
  debug('Processing message from queue for staging id %s', id)
  const transaction = await retrieveTransaction(id)

  const dataSourceOptionValue = await getGlobalOptionSetValue('defra_datasource', transaction.dataSource)
  const entities = []
  for (const { licensee, concession, permitId, referenceNumber, issueDate, startDate, endDate } of transaction.permissions) {
    const contact = await resolveContactPayload(licensee)
    const permit = await getReferenceDataForEntityAndId(Permit, permitId)

    const permission = new Permission()
    permission.referenceNumber = referenceNumber
    permission.stagingId = transaction.id
    permission.issueDate = issueDate
    permission.startDate = startDate
    permission.endDate = endDate
    permission.dataSource = dataSourceOptionValue

    permission.bindToContact(contact)
    permission.bindToPermit(permit)

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

  debug('Persisting entities for staging id %s: %O', id, entities)
  await persist(...entities)
  // TODO: Move to staged audit table
  debug('Removing staging data for staging id %s', id)
  await docClient.delete({ TableName: process.env.TRANSACTIONS_STAGING_TABLE, Key: { id } }).promise()
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
    throw Boom.notFound('A transaction for the provided identifier could not be found')
  }
  debug('Retrieved record for message with staging id %s: %O', id, record)
  return record
}
