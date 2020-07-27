import { retrieveStagedTransaction } from './retrieve-transaction.js'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_QUEUE } from '../../config.js'
import Boom from '@hapi/boom'
import { AWS } from '@defra-fish/connectors-lib'
import db from 'debug'
const { sqs, docClient } = AWS()
const debug = db('sales:transactions')

export async function finaliseTransaction ({ id, ...payload }) {
  debug('Received request to complete transaction %s', id)
  const transactionRecord = await retrieveStagedTransaction(id)
  if (transactionRecord.cost !== payload.payment.amount) {
    throw Boom.paymentRequired('The payment amount did not match the cost of the transaction')
  }
  if (!transactionRecord.isRecurringPaymentSupported && payload.payment.recurring) {
    throw Boom.conflict('The transaction does not support recurring payments but an instruction was supplied')
  }

  const setFieldExpression = Object.keys(payload).map(k => `${k} = :${k}`)
  const expressionAttributeValues = Object.entries(payload).reduce((acc, [k, v]) => ({ ...acc, [`:${k}`]: v }), {})
  await docClient
    .update({
      TableName: TRANSACTION_STAGING_TABLE.TableName,
      Key: { id },
      UpdateExpression: `SET ${setFieldExpression}`,
      ExpressionAttributeValues: expressionAttributeValues
    })
    .promise()
  debug('Updated transaction record for identifier %s', id)

  const receipt = await sqs
    .sendMessage({
      QueueUrl: TRANSACTION_QUEUE.Url,
      MessageGroupId: 'transactions',
      MessageDeduplicationId: id,
      MessageBody: JSON.stringify({ id })
    })
    .promise()

  debug('Sent transaction %s to staging queue with message-id %s', id, receipt.MessageId)
  return { status: 'queued', messageId: receipt.MessageId }
}
