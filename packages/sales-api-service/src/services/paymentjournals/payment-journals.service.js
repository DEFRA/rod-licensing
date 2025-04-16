import { AWS } from '@defra-fish/connectors-lib'
import { PAYMENTS_TABLE } from '../../config.js'
import db from 'debug'
const { docClient } = AWS()
const debug = db('sales:paymentjournals')

/**
 * Create a new payment journal
 * @param {*} payload
 * @returns {Promise<*>}
 */
export async function createPaymentJournal (id, payload) {
  const record = { id, expires: Math.floor(Date.now() / 1000) + PAYMENTS_TABLE.Ttl, ...payload }
  await docClient.put({ TableName: PAYMENTS_TABLE.TableName, Item: record, ConditionExpression: 'attribute_not_exists(id)' })
  debug('Payment journal stored with payload %o', record)
  return record
}

/**
 * Update an existing journal
 * @param {*} payload
 * @returns {Promise<*>}
 */
export async function updatePaymentJournal (id, payload) {
  const updates = { expires: Math.floor(Date.now() / 1000) + PAYMENTS_TABLE.Ttl, ...payload }
  const result = await docClient
    .update({
      TableName: PAYMENTS_TABLE.TableName,
      Key: { id },
      ...docClient.createUpdateExpression(updates),
      ConditionExpression: 'attribute_exists(id)',
      ReturnValues: 'ALL_NEW'
    })
  return result.Attributes
}

/**
 * Get an existing payment journal
 * @param {*} payload
 * @returns {Promise<*>}
 */
export async function getPaymentJournal (id) {
  const result = await docClient.get({ TableName: PAYMENTS_TABLE.TableName, Key: { id }, ConsistentRead: true })
  return result.Item
}

/**
 * Query for payment journals between the given from and to timestamps
 * @param {*} payload
 * @returns {Promise<*>}
 */
export async function queryJournalsByTimestamp ({ paymentStatus, from, to }) {
  return docClient.queryAllPromise({
    TableName: PAYMENTS_TABLE.TableName,
    IndexName: 'PaymentJournalsByStatusAndTimestamp',
    KeyConditionExpression: 'paymentStatus = :paymentStatus AND paymentTimestamp BETWEEN :from AND :to',
    ExpressionAttributeValues: { ':paymentStatus': paymentStatus, ':from': from, ':to': to }
  })
}
