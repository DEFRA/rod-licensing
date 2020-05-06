import { retrieveStagedTransaction } from './retrieve-transaction.js'
import Boom from '@hapi/boom'
import AWS from '../aws.js'
import db from 'debug'
const { sqs, docClient } = AWS()
const debug = db('sales:transactions')

export async function finaliseTransaction ({ id, ...payload }) {
  debug('Received request to complete transaction %s with payload %O', id, payload)
  const transactionRecord = await retrieveStagedTransaction(id)
  if (transactionRecord.cost !== payload.payment.amount) {
    throw Boom.paymentRequired('The payment amount did not match the cost of the transaction')
  }
  if (!transactionRecord.isRecurringPaymentSupported && payload.payment.recurring) {
    throw Boom.conflict('The transaction does not support recurring payments but an instruction was supplied')
  }

  const setFieldExpression = Object.keys(payload)
    .map(k => `${k} = :${k}`)
    .join(', ')
  const expressionAttributeValues = Object.entries(payload).reduce((acc, [k, v]) => ({ ...acc, [`:${k}`]: v }), {})
  await docClient
    .update({
      TableName: process.env.TRANSACTIONS_STAGING_TABLE,
      Key: { id },
      UpdateExpression: `SET ${setFieldExpression}`,
      ExpressionAttributeValues: expressionAttributeValues
    })
    .promise()
  debug('Updated transaction record for identifier %s')

  const receipt = await sqs
    .sendMessage({
      QueueUrl: process.env.TRANSACTIONS_QUEUE_URL,
      MessageGroupId: 'transactions',
      MessageDeduplicationId: id,
      MessageBody: JSON.stringify({ id })
    })
    .promise()

  debug('Sent transaction %s to staging queue with message-id %s', id, receipt.MessageId)
  return receipt.MessageId
}
