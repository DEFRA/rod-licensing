import Boom from '@hapi/boom'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_STAGING_HISTORY_TABLE } from '../../config.js'
import db from 'debug'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import { AWS } from '@defra-fish/connectors-lib'
const { docClient } = AWS()
const debug = db('sales:transactions')

export const retrieveStagedTransaction = async id => {
  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: TRANSACTION_STAGING_TABLE.TableName,
        Key: { id },
        ConsistentRead: true
      })
    )
    if (result?.Item) {
      debug('Retrieved transaction record for staging id %s', id)
      return result.Item
    }
    debug('Failed to retrieve a transaction with staging id %s from staging table', id)
    const historical = await docClient.send(
      new GetCommand({
        TableName: TRANSACTION_STAGING_HISTORY_TABLE.TableName,
        Key: { id },
        ConsistentRead: true
      })
    )
    if (historical?.Item) {
      throw Boom.resourceGone('The transaction has already been finalised', historical.Item)
    }
    throw Boom.notFound('A transaction for the specified identifier was not found')
  } catch (error) {
    debug('Error occurred while retrieving transaction with id %s: %O', id, error)
    throw error
  }
}
