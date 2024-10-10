import { DynamoDBDocumentClient, QueryCommand, ScanCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import AWS from '../aws.js'

const { docClient } = AWS()

describe('document client decorations', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)

  beforeEach(() => {
    ddbMock.reset()
  })

  it('deals with pagination where DynamoDB returns a LastEvaluatedKey in a query response', async () => {
    const testLastEvaluatedKey = { id: '16324258-85-92746491' }

    // mock QueryCommand to return items with a LastEvaluatedKey
    ddbMock.on(QueryCommand).resolvesOnce({ Items: [], LastEvaluatedKey: testLastEvaluatedKey }).resolvesOnce({ Items: [] })

    await docClient.queryAllPromise({ TableName: 'TEST' })

    // check QueryCommand was called twice & with the correct parameters
    expect(ddbMock.send.callCount).toBe(2)
    expect(ddbMock.send.firstCall.args[0].input.TableName).toEqual('TEST')
    expect(ddbMock.send.secondCall.args[0].input.ExclusiveStartKey).toEqual(testLastEvaluatedKey)
  })

  it('deals with pagination where DynamoDB returns a LastEvaluatedKey in a scan response', async () => {
    const testLastEvaluatedKey = { id: '16324258-85-92746491' }

    // mock ScanCommand to return items with a LastEvaluatedKey
    ddbMock.on(ScanCommand).resolvesOnce({ Items: [], LastEvaluatedKey: testLastEvaluatedKey }).resolvesOnce({ Items: [] })

    await docClient.scanAllPromise({ TableName: 'TEST' })

    // check ScanCommand was called twice & with the correct parameters
    expect(ddbMock.send.callCount).toBe(2)
    expect(ddbMock.send.firstCall.args[0].input.TableName).toEqual('TEST')
    expect(ddbMock.send.secondCall.args[0].input.ExclusiveStartKey).toEqual(testLastEvaluatedKey)
  })

  it('deals with UnprocessedItems when making batchWrite requests to DynamoDB', async () => {
    // mock BatchWriteCommand to return UnprocessedItems
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
      .resolvesOnce({ UnprocessedItems: null })

    await docClient.batchWriteAllPromise({
      RequestItems: {
        NameOfTableToUpdate: [
          { PutRequest: { Item: { key: '1', field: 'data1' } } },
          { PutRequest: { Item: { key: '2', field: 'data2' } } },
          { PutRequest: { Item: { key: '3', field: 'data3' } } }
        ]
      }
    })

    // check BatchWriteCommand was called twice & with the correct parameters
    expect(ddbMock.send.callCount).toBe(2)
    expect(ddbMock.send.firstCall.args[0].input.RequestItems.NameOfTableToUpdate).toHaveLength(3)
    expect(ddbMock.send.secondCall.args[0].input.RequestItems.NameOfTableToUpdate).toHaveLength(2)
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

    jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())

    await expect(docClient.batchWriteAllPromise(request)).rejects.toThrow(
      'Failed to write items to DynamoDB using batch write. UnprocessedItems were returned and maxRetries has been reached.'
    )
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
