import Boom from '@hapi/boom'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_STAGING_HISTORY_TABLE } from '../../config.js'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
const { docClient } = AWS()
const debug = db('sales:transactions')

export const retrieveStagedTransaction = async id => {
  const result = await docClient.get({ TableName: TRANSACTION_STAGING_TABLE.TableName, Key: { id }, ConsistentRead: true })
  if (!result.Item) {
    debug('Failed to retrieve a transaction with staging id %s', id)
    const historical = await docClient.get({ TableName: TRANSACTION_STAGING_HISTORY_TABLE.TableName, Key: { id }, ConsistentRead: true })
    if (historical.Item) {
      throw Boom.resourceGone('The transaction has already been finalised', historical.Item)
    }
    throw Boom.notFound('A transaction for the specified identifier was not found')
  }
  debug('Retrieved transaction record for staging id %s', id)
  return result.Item
}
