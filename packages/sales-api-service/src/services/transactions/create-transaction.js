import { calculateEndDate, generatePermissionNumber } from '../permissions.service.js'
import { getReferenceDataForEntityAndId } from '../reference-data.service.js'
import { v4 as uuidv4 } from 'uuid'
import AWS from '../aws.js'
import db from 'debug'
import { Permit } from '@defra-fish/dynamics-lib'
const { docClient } = AWS()
const debug = db('sales:transactions')
const STAGING_TTL_DELTA = process.env.TRANSACTION_STAGING_TABLE_TTL || 60 * 60 * 48

export async function createTransaction (payload) {
  const transactionId = uuidv4()
  debug('Creating new transaction %s', transactionId)
  const record = {
    id: transactionId,
    expires: Math.floor(Date.now() / 1000) + STAGING_TTL_DELTA,
    cost: 0.0,
    isRecurringPaymentSupported: true,
    ...payload
  }

  // Generate derived fields
  for (const permission of record.permissions) {
    permission.referenceNumber = await generatePermissionNumber(permission, payload.dataSource)
    permission.endDate = await calculateEndDate(permission)

    const permit = await getReferenceDataForEntityAndId(Permit, permission.permitId)
    record.isRecurringPaymentSupported = record.isRecurringPaymentSupported && permit.isRecurringPaymentSupported
    record.cost += permit.cost
  }

  await docClient
    .put({ TableName: process.env.TRANSACTIONS_STAGING_TABLE, Item: record, ConditionExpression: 'attribute_not_exists(id)' })
    .promise()

  debug('Transaction %s stored with payload %O', transactionId, record)
  return record
}
