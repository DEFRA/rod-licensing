import Boom from '@hapi/boom'
import AWS from '../aws.js'
import db from 'debug'
const { sqs, docClient } = AWS()
const debug = db('sales:transactions')

export async function finaliseTransaction ({ id, ...payload }) {
  try {
    debug('Received request to complete transaction %s with payload %O', id, payload)
    const setFieldExpression = Object.keys(payload)
      .map(k => `${k} = :${k}`)
      .join(', ')
    const expressionAttributeValues = Object.entries(payload).reduce((acc, [k, v]) => ({ ...acc, [`:${k}`]: v }), {})

    const transactionRecord = await docClient
      .update({
        TableName: process.env.TRANSACTIONS_STAGING_TABLE,
        Key: { id },
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression: `SET ${setFieldExpression}`,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      })
      .promise()
    debug('Updated transaction record for identifier %s: %O', id, transactionRecord.Attributes)

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
  } catch (e) {
    if (e.code === 'ConditionalCheckFailedException') {
      debug('Transaction for identifier %s was not found', id)
      throw Boom.notFound('A transaction for the specified identifier was not found')
    }
    throw e
  }
}
