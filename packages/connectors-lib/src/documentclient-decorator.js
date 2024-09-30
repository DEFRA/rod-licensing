import db from 'debug'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocument, BatchWriteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
const debug = db('connectors:aws')

export const createDocumentClient = (options = {}) => {
  const client = new DynamoDB({
    ...options,
    region: options.region || process.env.AWS_REGION || 'eu-west-2'
  })
  const docClient = DynamoDBDocument.from(client)

  // Support for large query/scan operations which return results in pages
  const wrapPagedDocumentClientOperation = (operationName) => {
    return async (params) => {
      const items = []
      let lastEvaluatedKey = null
      do {
        const Command = operationName === 'query' ? QueryCommand : ScanCommand
        const response = await docClient.send(new Command({
          ...params,
          ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
        }))
        lastEvaluatedKey = response.LastEvaluatedKey
        response.Items && items.push(...response.Items)
      } while (lastEvaluatedKey)
      return items
    }
  }
  docClient.queryAllPromise = wrapPagedDocumentClientOperation('query')
  docClient.scanAllPromise = wrapPagedDocumentClientOperation('scan')

  /**
   * Handles batch writes which may return UnprocessedItems.  If UnprocessedItems are returned then they will be retried with exponential backoff
   *
   * @param {DocumentClient.BatchWriteItemInput} params as per DynamoDB.DocumentClient.batchWrite
   * @returns {Promise<void>}
   */
  docClient.batchWriteAllPromise = async (params) => {
    let request = { ...params }
    let hasUnprocessedItems = !!Object.keys(request.RequestItems).length
    let unprocessedItemsDelay = 500
    let maxRetries = 10
    while (hasUnprocessedItems) {
      const result = await docClient.send(new BatchWriteCommand(request))
      hasUnprocessedItems = !!Object.keys(result.UnprocessedItems ?? {}).length
      if (hasUnprocessedItems) {
        request = { ...params, RequestItems: result.UnprocessedItems }
        if (maxRetries-- === 0) {
          throw new Error(
            'Failed to write items to DynamoDB using batch write. UnprocessedItems were returned and maxRetries has been reached.'
          )
        }
        await new Promise(resolve => setTimeout(resolve, unprocessedItemsDelay))
        unprocessedItemsDelay = Math.min(2500, unprocessedItemsDelay * 1.5)
        debug('Replaying DynamoDB batchWrite operation due to UnprocessedItems: %o', request.RequestItems)
      }
    }
  }

  docClient.createUpdateExpression = (payload) =>
    Object.entries(payload).reduce(
      (acc, [k, v], idx) => {
        acc.UpdateExpression += `${idx > 0 ? ',' : ''}#${k} = :${k}`
        acc.ExpressionAttributeNames[`#${k}`] = k
        acc.ExpressionAttributeValues[`:${k}`] = v
        return acc
      },
      { UpdateExpression: 'SET ', ExpressionAttributeNames: {}, ExpressionAttributeValues: {} }
    )

  return docClient
}
