import AWS from 'aws-sdk'
const { DynamoDB } = AWS

export const createDocumentClient = options => {
  const docClient = new DynamoDB.DocumentClient(options)

  // Support for large query/scan operations which return results in pages
  const wrapPagedDocumentClientOperation = operationName => {
    return async params => {
      const items = []
      let lastEvaluatedKey = null
      do {
        const response = await docClient[operationName]({
          ...params,
          ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
        }).promise()
        lastEvaluatedKey = response.LastEvaluatedKey
        response.Items && items.push(...response.Items)
      } while (lastEvaluatedKey)
      return items
    }
  }
  docClient.queryAllPromise = wrapPagedDocumentClientOperation('query')
  docClient.scanAllPromise = wrapPagedDocumentClientOperation('scan')

  return docClient
}
