import { persist, StagingException } from '@defra-fish/dynamics-lib'
import { processQueue } from './process-transaction-queue.js'
import { retrieveStagedTransaction } from './retrieve-transaction.js'
import AWS from '../aws.js'
import db from 'debug'
const { docClient } = AWS()
const debug = db('sales:transactions')
const STAGING_ERRORS_TTL_DELTA = 60 * 60 * 24 * 365

export async function processDlq ({ id }) {
  debug('Processed message from dlq with payload', id)
  const { exception, transaction } = await getProcessingException(id)
  if (exception) {
    const stagingException = new StagingException()
    stagingException.stagingId = id
    stagingException.description = (exception.error && exception.error.message) || String(exception)
    stagingException.exceptionJson = JSON.stringify(
      {
        transaction: transaction,
        exception: {
          ...exception,
          stack: exception.stack.split('\n')
        }
      },
      null,
      4
    )
    await persist(stagingException)

    if (transaction) {
      try {
        await docClient
          .update({
            TableName: process.env.TRANSACTIONS_STAGING_TABLE,
            Key: { id },
            ConditionExpression: 'attribute_exists(id)',
            UpdateExpression: 'SET expires = :expires',
            ExpressionAttributeValues: {
              ':expires': Math.floor(Date.now() / 1000) + STAGING_ERRORS_TTL_DELTA
            }
          })
          .promise()
      } catch (e) {
        console.error('Unable to update expiry on unprocessable transaction: ', transaction, e)
      }
    }
  }
}

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
