import * as db from '../db.js'
import { docClient } from '../../../../connectors-lib/src/aws.js'
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb'

jest.mock('../../config.js', () => ({
  db: {
    fileStagingTable: 'TestFileTable',
    recordStagingTable: 'TestRecordTable',
    stagingTtlDelta: 60 * 60 * 168
  }
}))

jest.mock('../../../../connectors-lib/src/aws.js', () => ({
  docClient: {
    send: jest.fn(),
    scanAllPromise: jest.fn(),
    queryAllPromise: jest.fn(),
    batchWriteAllPromise: jest.fn(),
    createUpdateExpression: jest.fn()
  }
}))

describe('database operations', () => {
  const TEST_FILENAME = 'testfile.xml'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getFileRecord', () => {
    it('calls GetCommand on dynamodb', async () => {
      const mockItem = { id: 'testfile.xml' }
      docClient.send.mockResolvedValueOnce({ Item: mockItem })

      const result = await db.getFileRecord(TEST_FILENAME)

      expect(docClient.send).toHaveBeenCalledWith(expect.any(GetCommand))

      const calledCommandInstance = docClient.send.mock.calls[0][0]
      expect(calledCommandInstance.input).toEqual({
        TableName: 'TestFileTable',
        Key: { filename: TEST_FILENAME },
        ConsistentRead: true
      })

      expect(result).toEqual(mockItem)
    })
  })

  describe('getFileRecords', () => {
    it('retrieves all records for the given file if no stages are provided', async () => {
      const mockItems = []
      docClient.scanAllPromise.mockResolvedValueOnce(mockItems)

      const result = await db.getFileRecords()

      expect(docClient.scanAllPromise).toHaveBeenCalledWith({
        TableName: 'TestFileTable',
        ConsistentRead: true,
        ExpressionAttributeValues: {}
      })
      expect(result).toEqual(mockItems)
    })

    it('retrieves all records for a given set of stages', async () => {
      const mockItems = []
      docClient.scanAllPromise.mockResolvedValueOnce(mockItems)

      const result = await db.getFileRecords('STAGE 1', 'STAGE 2')

      expect(docClient.scanAllPromise).toHaveBeenCalledWith({
        TableName: 'TestFileTable',
        FilterExpression: 'stage IN (:stage0,:stage1)',
        ExpressionAttributeValues: { ':stage0': 'STAGE 1', ':stage1': 'STAGE 2' },
        ConsistentRead: true
      })
      expect(result).toEqual(mockItems)
    })
  })

  describe('updateFileStagingTable', () => {
    it('calls UpdateCommand on dynamodb', async () => {
      const entries = { param1: 'test1', param2: 'test2' }
      const mockAttributes = { id: 'testfile.xml', param1: 'test1', param2: 'test2' }
      const mockUpdateExpression = {
        UpdateExpression: 'SET #expires = :expires,#param1 = :param1,#param2 = :param2',
        ExpressionAttributeNames: {
          '#expires': 'expires',
          '#param1': 'param1',
          '#param2': 'param2'
        },
        ExpressionAttributeValues: {
          ':expires': 1234567890,
          ':param1': 'test1',
          ':param2': 'test2'
        }
      }
      docClient.createUpdateExpression.mockReturnValue(mockUpdateExpression)
      docClient.send.mockResolvedValueOnce({ Attributes: mockAttributes })

      await db.updateFileStagingTable({ filename: TEST_FILENAME, ...entries })

      expect(docClient.createUpdateExpression).toHaveBeenCalledWith({
        expires: expect.any(Number),
        ...entries
      })
      expect(docClient.send).toHaveBeenCalledWith(expect.any(UpdateCommand))

      const calledCommandInstance = docClient.send.mock.calls[0][0]
      expect(calledCommandInstance.input).toEqual({
        TableName: 'TestFileTable',
        Key: { filename: TEST_FILENAME },
        UpdateExpression: mockUpdateExpression.UpdateExpression,
        ExpressionAttributeNames: mockUpdateExpression.ExpressionAttributeNames,
        ExpressionAttributeValues: mockUpdateExpression.ExpressionAttributeValues
      })
    })
  })

  describe('updateRecordStagingTable', () => {
    it('calls batchWriteAllPromise on dynamodb', async () => {
      const records = [{ id: 'test1' }, { id: 'test2' }]
      docClient.batchWriteAllPromise.mockResolvedValueOnce({ UnprocessedItems: {} })

      await db.updateRecordStagingTable(TEST_FILENAME, records)

      expect(docClient.batchWriteAllPromise).toHaveBeenCalledWith({
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
      })
    })

    it('is a no-op if records is empty', async () => {
      await db.updateRecordStagingTable(TEST_FILENAME, [])
      expect(docClient.batchWriteAllPromise).not.toHaveBeenCalled()
    })
  })

  describe('getProcessedRecords', () => {
    it('retrieves all records for the given file if no stages are provided', async () => {
      const mockItems = []
      docClient.queryAllPromise.mockResolvedValueOnce(mockItems)

      const result = await db.getProcessedRecords(TEST_FILENAME)

      expect(docClient.queryAllPromise).toHaveBeenCalledWith({
        TableName: 'TestRecordTable',
        KeyConditionExpression: 'filename = :filename',
        ExpressionAttributeValues: { ':filename': TEST_FILENAME },
        ConsistentRead: true
      })
      expect(result).toEqual(mockItems)
    })

    it('retrieves all records at given set of stages', async () => {
      const mockItems = []
      docClient.queryAllPromise.mockResolvedValueOnce(mockItems)

      const result = await db.getProcessedRecords(TEST_FILENAME, 'STAGE 1', 'STAGE 2')

      expect(docClient.queryAllPromise).toHaveBeenCalledWith({
        TableName: 'TestRecordTable',
        KeyConditionExpression: 'filename = :filename',
        FilterExpression: 'stage IN (:stage0,:stage1)',
        ExpressionAttributeValues: { ':filename': TEST_FILENAME, ':stage0': 'STAGE 1', ':stage1': 'STAGE 2' },
        ConsistentRead: true
      })
      expect(result).toEqual(mockItems)
    })
  })
})
