import { calculateEndDate, generatePermissionNumber } from '../permissions.service.js'
import { getReferenceDataForEntityAndId } from '../reference-data.service.js'
import uuid from 'uuid/v4.js'
import AWS from '../aws.js'
import db from 'debug'
import { Permit } from '@defra-fish/dynamics-lib'
const { docClient } = AWS()
const debug = db('sales:transactions')
const STAGING_TTL_DELTA = process.env.TRANSACTION_STAGING_TABLE_TTL || 60 * 60 * 48

export async function createTransaction (payload) {
  const transactionId = uuid()
  debug('Creating new transaction %s', transactionId)
  const record = { id: transactionId, expires: Math.floor(Date.now() / 1000) + STAGING_TTL_DELTA, ...payload }

  // Generate derived fields
  let cost = 0.0
  for (const permission of record.permissions) {
    permission.referenceNumber = await generatePermissionNumber(permission, payload.dataSource)
    permission.endDate = await calculateEndDate(permission)

    const permit = await getReferenceDataForEntityAndId(Permit, permission.permitId)
    cost += permit.cost
  }
  record.cost = cost

  await docClient
    .put({ TableName: process.env.TRANSACTIONS_STAGING_TABLE, Item: record, ConditionExpression: 'attribute_not_exists(id)' })
    .promise()

  debug('Transaction %s stored with payload %O', transactionId, record)
  return record
}
