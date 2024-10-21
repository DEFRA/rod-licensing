import * as db from '../db.js'
import { DynamoDBDocument, GetCommand, UpdateCommand, BatchWriteCommand, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('@aws-sdk/lib-dynamodb', () => {
  const actualLib = jest.requireActual('@aws-sdk/lib-dynamodb')

  return {
    DynamoDBDocument: {
      from: jest.fn().mockReturnValue({
        send: jest.fn(command => {
          if (command instanceof actualLib.GetCommand) {
            return Promise.resolve({ Item: { id: 'testfile.xml' } })
          }

          if (command instanceof actualLib.UpdateCommand) {
            return Promise.resolve({ Attributes: { id: 'testfile.xml', param1: 'test1', param2: 'test2' } })
          }

          if (command instanceof actualLib.BatchWriteCommand) {
            return Promise.resolve({ UnprocessedItems: {} })
          }

          if (command instanceof actualLib.QueryCommand || command instanceof actualLib.ScanCommand) {
            return Promise.resolve({ Items: [] })
          }
          return Promise.resolve({})
        })
      })
    },
    GetCommand: actualLib.GetCommand,
    UpdateCommand: actualLib.UpdateCommand,
    BatchWriteCommand: actualLib.BatchWriteCommand,
    QueryCommand: actualLib.QueryCommand,
    ScanCommand: actualLib.ScanCommand
  }
})

jest.mock('../../config.js', () => ({
  db: {
    fileStagingTable: 'TestFileTable',
    recordStagingTable: 'TestRecordTable',
    stagingTtlDelta: 60 * 60 * 168
  }
}))

describe('database operations', () => {
  const TEST_FILENAME = 'testfile.xml'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFileRecord', () => {
    it('calls a get operation on dynamodb', async () => {
      await db.getFileRecord(TEST_FILENAME)
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(expect.any(GetCommand))
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TestFileTable',
            Key: { filename: TEST_FILENAME },
            ConsistentRead: true
          }
        })
      )
    })
  })

  describe('getFileRecords', () => {
    it('retrieves all records for the given file if no stages are provided', async () => {
      await db.getFileRecords()
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(expect.any(ScanCommand))
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TestFileTable',
            ConsistentRead: true,
            ExpressionAttributeValues: {}
          }
        })
      )
    })

    it('retrieves all records for a given set of stages', async () => {
      await db.getFileRecords('STAGE 1', 'STAGE 2')
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(expect.any(ScanCommand))
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TestFileTable',
            FilterExpression: 'stage IN (:stage0,:stage1)',
            ExpressionAttributeValues: { ':stage0': 'STAGE 1', ':stage1': 'STAGE 2' },
            ConsistentRead: true
          }
        })
      )
    })
  })

  describe('updateFileStagingTable', () => {
    it('calls update on dynamodb including all necessary parameters', async () => {
      await db.updateFileStagingTable({ filename: TEST_FILENAME, param1: 'test1', param2: 'test2' })
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(expect.any(UpdateCommand))
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TestFileTable',
            Key: { filename: TEST_FILENAME },
            UpdateExpression: 'SET #expires = :expires,#param1 = :param1,#param2 = :param2',
            ExpressionAttributeNames: {
              '#expires': 'expires',
              '#param1': 'param1',
              '#param2': 'param2'
            },
            ExpressionAttributeValues: {
              ':expires': expect.any(Number),
              ':param1': 'test1',
              ':param2': 'test2'
            }
          }
        })
      )
    })
  })

  describe('updateRecordStagingTable', () => {
    it('calls batchWrite on dynamodb including all necessary parameters', async () => {
      const records = [{ id: 'test1' }, { id: 'test2' }]
      await db.updateRecordStagingTable(TEST_FILENAME, records)
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(expect.any(BatchWriteCommand))
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            RequestItems: {
              TestRecordTable: [
                {
                  PutRequest: {
                    Item: { filename: TEST_FILENAME, id: 'test1', expires: expect.any(Number) }
                  }
                },
                {
                  PutRequest: {
                    Item: { filename: TEST_FILENAME, id: 'test2', expires: expect.any(Number) }
                  }
                }
              ]
            }
          }
        })
      )
    })

    it('is a no-op if records are empty', async () => {
      await db.updateRecordStagingTable(TEST_FILENAME, [])
      expect(DynamoDBDocument.from().send).not.toHaveBeenCalled()
    })
  })

  describe('getProcessedRecords', () => {
    it('retrieves all records for the given file if no stages are provided', async () => {
      await db.getProcessedRecords(TEST_FILENAME)
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(expect.any(QueryCommand))
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TestRecordTable',
            KeyConditionExpression: 'filename = :filename',
            ExpressionAttributeValues: { ':filename': TEST_FILENAME },
            ConsistentRead: true
          }
        })
      )
    })

    it('retrieves all records for a given set of stages', async () => {
      await db.getProcessedRecords(TEST_FILENAME, 'STAGE 1', 'STAGE 2')
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(expect.any(QueryCommand))
      expect(DynamoDBDocument.from().send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: {
            TableName: 'TestRecordTable',
            KeyConditionExpression: 'filename = :filename',
            FilterExpression: 'stage IN (:stage0,:stage1)',
            ExpressionAttributeValues: { ':filename': TEST_FILENAME, ':stage0': 'STAGE 1', ':stage1': 'STAGE 2' },
            ConsistentRead: true
          }
        })
      )
    })
  })
})
