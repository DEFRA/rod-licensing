import AWSSdk from 'aws-sdk'
import AWS from '../aws.js'
const { docClient } = AWS()

describe('document client decorations', () => {
  it('deals with pagination where DynamoDB returns a LastEvaluatedKey in a query response', async () => {
    const testLastEvaluatedKey = { id: '16324258-85-92746491' }

    AWSSdk.DynamoDB.DocumentClient.__setNextResponses(
      'query',
      {
        Items: [],
        LastEvaluatedKey: testLastEvaluatedKey
      },
      {
        Items: []
      }
    )
    await docClient.queryAllPromise({
      TableName: 'TEST'
    })
    expect(AWSSdk.DynamoDB.DocumentClient.mockedMethods.query).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        TableName: 'TEST'
      })
    )
    expect(AWSSdk.DynamoDB.DocumentClient.mockedMethods.query).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        TableName: 'TEST',
        ExclusiveStartKey: testLastEvaluatedKey
      })
    )
  })

  it('deals with pagination where DynamoDB returns a LastEvaluatedKey in a scan response', async () => {
    const testLastEvaluatedKey = { id: '16324258-85-92746491' }

    AWSSdk.DynamoDB.DocumentClient.__setNextResponses(
      'scan',
      {
        Items: [],
        LastEvaluatedKey: testLastEvaluatedKey
      },
      {
        Items: []
      }
    )
    await docClient.scanAllPromise({
      TableName: 'TEST'
    })
    expect(AWSSdk.DynamoDB.DocumentClient.mockedMethods.scan).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        TableName: 'TEST'
      })
    )
    expect(AWSSdk.DynamoDB.DocumentClient.mockedMethods.scan).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        TableName: 'TEST',
        ExclusiveStartKey: testLastEvaluatedKey
      })
    )
  })

  it('deals with UnprocessedItems when making batchWrite requests to DynamoDB', async () => {
    AWSSdk.DynamoDB.DocumentClient.__setNextResponses(
      'batchWrite',
      {
        UnprocessedItems: {
          NameOfTableToUpdate: [
            { PutRequest: { Item: { key: '1', field: 'data1' } } },
            { PutRequest: { Item: { key: '2', field: 'data2' } } }
          ]
        }
      },
      {
        UnprocessedItems: null
      }
    )
    await docClient.batchWriteAllPromise({
      RequestItems: {
        NameOfTableToUpdate: [
          { PutRequest: { Item: { key: '1', field: 'data1' } } },
          { PutRequest: { Item: { key: '2', field: 'data2' } } },
          { PutRequest: { Item: { key: '3', field: 'data3' } } }
        ]
      }
    })
    expect(AWSSdk.DynamoDB.DocumentClient.mockedMethods.batchWrite).toHaveBeenCalledTimes(2)
    expect(AWSSdk.DynamoDB.DocumentClient.mockedMethods.batchWrite).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        RequestItems: {
          NameOfTableToUpdate: [
            { PutRequest: { Item: { key: '1', field: 'data1' } } },
            { PutRequest: { Item: { key: '2', field: 'data2' } } },
            { PutRequest: { Item: { key: '3', field: 'data3' } } }
          ]
        }
      })
    )
    expect(AWSSdk.DynamoDB.DocumentClient.mockedMethods.batchWrite).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        RequestItems: {
          NameOfTableToUpdate: [
            { PutRequest: { Item: { key: '1', field: 'data1' } } },
            { PutRequest: { Item: { key: '2', field: 'data2' } } }
          ]
        }
      })
    )
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
    AWSSdk.DynamoDB.DocumentClient.__setNextResponses('batchWrite', ...batchWriteResponses)
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
      'Failed to write items to DynamoDB using batch write.  UnprocessedItems were returned and maxRetries has been reached.'
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
