import { TRANSACTION_STATUS } from './constants.js'
import { getReferenceDataForEntityAndId } from '../reference-data.service.js'
import { TRANSACTION_STAGING_TABLE } from '../../config.js'
import { v4 as uuidv4 } from 'uuid'
import db from 'debug'
import { Permit } from '@defra-fish/dynamics-lib'
import { getPermissionCost } from '@defra-fish/business-rules-lib'
import { PutCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import AWS from '../../../../connectors-lib/src/aws.js'
const { docClient } = AWS

const debug = db('sales:transactions')

/**
 * Create a single new transaction
 * @param {*} payload
 * @returns {Promise<*>}
 */
export async function createTransaction (payload) {
  const record = await createTransactionRecord(payload)
  await docClient.send(
    new PutCommand({
      TableName: TRANSACTION_STAGING_TABLE.TableName,
      Item: record,
      ConditionExpression: 'attribute_not_exists(id)'
    })
  )
  debug('Transaction %s successfully created in DynamoDB table %s', record.id, TRANSACTION_STAGING_TABLE.TableName)
  return record
}

/**
 * Create transactions in batch mode
 *
 * @param {Array<*>} payload the map containing the create transaction requests to be actioned
 * @returns {Promise<Array<*>>}
 */
export async function createTransactions (payload) {
  const records = await Promise.all(payload.map(i => createTransactionRecord(i)))
  const params = {
    RequestItems: {
      [TRANSACTION_STAGING_TABLE.TableName]: records.map(record => ({ PutRequest: { Item: record } }))
    }
  }
  await docClient.send(new BatchWriteCommand(params))
  debug('%d transactions created in batch', records.length)
  return records
}

/**
 * Create a transaction record from the transaction payload provided
 *
 * @param {*} payload
 * @returns {Promise<*>}
 */
async function createTransactionRecord (payload) {
  const transactionId = payload.transactionId || uuidv4()
  debug('Creating new transaction %s for %s', transactionId, payload.dataSource)
  const record = {
    id: transactionId,
    expires: Math.floor(Date.now() / 1000) + TRANSACTION_STAGING_TABLE.Ttl,
    status: {
      id: TRANSACTION_STATUS.STAGED
    },
    cost: 0.0,
    isRecurringPaymentSupported: true,
    ...payload
  }

  // Generate derived fields
  for (const { permitId, startDate } of record.permissions) {
    const permit = await getReferenceDataForEntityAndId(Permit, permitId)
    record.isRecurringPaymentSupported = record.isRecurringPaymentSupported && permit.isRecurringPaymentSupported
    record.cost += getPermissionCost({
      startDate,
      permit
    })
  }
  return record
}
