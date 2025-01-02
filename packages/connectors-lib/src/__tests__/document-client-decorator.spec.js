import { DynamoDBDocumentClient, QueryCommand, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { createDocumentClient } from '../documentclient-decorator'

describe('document client decorations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const docClient = createDocumentClient()

  beforeEach(() => {
    ddbMock.reset()
    // docClient = createDocumentClient()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('deals with pagination where DynamoDB returns a LastEvaluatedKey in a query response', async () => {
    const testLastEvaluatedKey = { id: '16324258-85-92746491' }

    ddbMock
      .on(QueryCommand)
      .resolvesOnce({
        Items: [{ id: 'item1' }],
        LastEvaluatedKey: testLastEvaluatedKey
      })
      .resolvesOnce({
        Items: [{ id: 'item2' }]
      })

    const items = await docClient.queryAllPromise({ TableName: 'TEST' })

    expect(ddbMock.calls()).toHaveLength(2)
    const firstCall = ddbMock.call(0).args[0].input
    expect(firstCall.TableName).toEqual('TEST')
    const secondCall = ddbMock.call(1).args[0].input
    expect(secondCall.ExclusiveStartKey).toEqual(testLastEvaluatedKey)
    expect(items).toEqual([{ id: 'item1' }, { id: 'item2' }])
  })

  it('deals with pagination where DynamoDB returns a LastEvaluatedKey in a scan response', async () => {
    const testLastEvaluatedKey = { id: '16324258-85-92746491' }

    ddbMock
      .on(ScanCommand)
      .resolvesOnce({
        Items: [{ id: 'item1' }],
        LastEvaluatedKey: testLastEvaluatedKey
      })
      .resolvesOnce({
        Items: [{ id: 'item2' }]
      })

    const items = await docClient.scanAllPromise({ TableName: 'TEST' })

    expect(ddbMock.calls()).toHaveLength(2)
    const firstCall = ddbMock.call(0).args[0].input
    expect(firstCall.TableName).toEqual('TEST')
    const secondCall = ddbMock.call(1).args[0].input
    expect(secondCall.ExclusiveStartKey).toEqual(testLastEvaluatedKey)
    expect(items).toEqual([{ id: 'item1' }, { id: 'item2' }])
  })

  it('deals with UnprocessedItems when making batchWrite requests to DynamoDB', async () => {
    ddbMock
      .on(BatchWriteCommand)
      .resolvesOnce({
        UnprocessedItems: {
          NameOfTableToUpdate: [
            { PutRequest: { Item: { key: '1', field: 'data1' } } },
            { PutRequest: { Item: { key: '2', field: 'data2' } } }
          ]
        }
      })
      .resolvesOnce({
        UnprocessedItems: {}
      })

    const request = {
      RequestItems: {
        NameOfTableToUpdate: [
          { PutRequest: { Item: { key: '1', field: 'data1' } } },
          { PutRequest: { Item: { key: '2', field: 'data2' } } },
          { PutRequest: { Item: { key: '3', field: 'data3' } } }
        ]
      }
    }

    await docClient.batchWriteAllPromise(request)
    expect(ddbMock.calls()).toHaveLength(2)
    const firstCall = ddbMock.call(0).args[0].input
    expect(firstCall.RequestItems.NameOfTableToUpdate).toHaveLength(3)
    const secondCall = ddbMock.call(1).args[0].input
    expect(secondCall.RequestItems.NameOfTableToUpdate).toHaveLength(2)
  })

  it('deals with UnprocessedItems when making batchWrite requests to DynamoDB up to the given retry limit', async () => {
    const batchWriteResponses = Array(11).fill({
      UnprocessedItems: {
        NameOfTableToUpdate: [
          { PutRequest: { Item: { key: '1', field: 'data1' } } },
          { PutRequest: { Item: { key: '2', field: 'data2' } } }
        ]
      }
    })
    ddbMock.on(BatchWriteCommand).resolves(...batchWriteResponses)

    const request = {
      RequestItems: {
        NameOfTableToUpdate: [
          { PutRequest: { Item: { key: '1', field: 'data1' } } },
          { PutRequest: { Item: { key: '2', field: 'data2' } } },
          { PutRequest: { Item: { key: '3', field: 'data3' } } }
        ]
      }
    }
    // Don't delay on setTimeouts!
    jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())
    await expect(docClient.batchWriteAllPromise(request)).rejects.toThrow(
      'Failed to write items to DynamoDB using batch write. UnprocessedItems were returned and maxRetries has been reached.'
    )
    expect(ddbMock.calls()).toHaveLength(11)
  })

  it('provides a convenience method to simplify building an update expression for DynamoDB', async () => {
    const test = {
      name: 'name-value',
      number: 123
    }
    expect(docClient.createUpdateExpression(test)).toStrictEqual({
      UpdateExpression: 'SET #name = :name,#number = :number',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#number': 'number'
      },
      ExpressionAttributeValues: {
        ':name': 'name-value',
        ':number': 123
      }
    })
  })
})
