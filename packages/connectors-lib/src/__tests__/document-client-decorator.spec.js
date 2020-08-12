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
