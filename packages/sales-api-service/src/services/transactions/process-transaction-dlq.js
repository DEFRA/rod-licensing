import { processQueue } from './process-transaction-queue.js'
import { retrieveStagedTransaction } from './retrieve-transaction.js'
import { createStagingExceptionFromError } from '../exceptions/exceptions.service.js'
import { TRANSACTION_STAGING_TABLE } from '../../config.js'
import db from 'debug'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import AWS from '../../../../connectors-lib/src/aws.js'
const { docClient } = AWS

const debug = db('sales:transactions')

export async function processDlq ({ id }) {
  debug('Processed message from dlq with payload', id)
  const { exception, transaction } = await getProcessingException(id)
  if (exception) {
    await createStagingExceptionFromError(id, exception, transaction)
    if (transaction) {
      try {
        await docClient.send(
          new UpdateCommand({
            TableName: TRANSACTION_STAGING_TABLE.TableName,
            Key: { id },
            ConditionExpression: 'attribute_exists(id)',
            UpdateExpression: 'SET expires = :expires',
            ExpressionAttributeValues: {
              ':expires': Math.floor(Date.now() / 1000) + TRANSACTION_STAGING_TABLE.StagingErrorsTtl
            }
          })
        )
      } catch (e) {
        console.error('Unable to update expiry on unprocessable transaction: ', transaction, e)
      }
    }
  }
}

/**
 * Determine the reason for the processing exception
 *
 * @param id
 * @returns {Promise<{exception: Error|null, transaction: Object|null}>}
 */
const getProcessingException = async id => {
  let exception = null
  let transaction = null
  try {
    // Attempt to process the message one final time, catch any exceptions
    await processQueue({ id })
  } catch (processingException) {
    exception = processingException
    // The exception may be due to a problem fetching from dynamodb so record that here.
    try {
      transaction = await retrieveStagedTransaction(id)
    } catch (databaseException) {
      exception = databaseException
    }
  }
  return { exception, transaction }
}
