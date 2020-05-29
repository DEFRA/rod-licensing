import Boom from '@hapi/boom'
import { TRANSACTIONS_STAGING_TABLE } from '../../config.js'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
const { docClient } = AWS()
const debug = db('sales:transactions')

export const retrieveStagedTransaction = async id => {
  const result = await docClient.get({ TableName: TRANSACTIONS_STAGING_TABLE.TableName, Key: { id }, ConsistentRead: true }).promise()
  const record = result.Item
  if (!record) {
    debug('Failed to retrieve a transaction with staging id %s', id)
    throw Boom.notFound('A transaction for the specified identifier was not found')
  }
  debug('Retrieved transaction record for staging id %s: %O', id, record)
  return record
}
