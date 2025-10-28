import { TRANSACTION_STAGING_TABLE } from '../../config.js'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
const { docClient } = AWS()
const debug = db('sales:transactions')

export async function updateRecurringTransaction ({ id, ...payload }) {
  debug('Updating transaction %s', id)

  const { Attributes: updatedRecord } = await docClient.update({
    TableName: TRANSACTION_STAGING_TABLE.TableName,
    Key: { id },
    ...docClient.createUpdateExpression({
      ...payload
    }),
    ReturnValues: 'ALL_NEW'
  })
  debug('Updated transaction record for identifier %s', id)

  return updatedRecord
}
