import { TRANSACTION_STAGING_TABLE } from '../../config.js'
import { TRANSACTION_SOURCE } from '@defra-fish/business-rules-lib'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
const { docClient } = AWS()
const debug = db('sales:transactions')

/**
 * Update a transaction's source and payment type in DynamoDB
 *
 * @param {string} id - The transaction id
 * @param {string} source - The card source
 * @returns {Promise<*>} - The updated transaction record
 */
export async function updateTransactionSourceAndPaymentType (id, type) {
  debug('Updating transaction %s', id)

  const { Attributes: updatedRecord } = await docClient.update({
    TableName: TRANSACTION_STAGING_TABLE.TableName,
    Key: { id },
    ...docClient.createUpdateExpression({
      payment: {
        source: TRANSACTION_SOURCE.govPay,
        method: type
      }
    }),
    ReturnValues: 'ALL_NEW'
  })

  return updatedRecord
}
