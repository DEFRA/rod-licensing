import * as db from '../db.js'
import { AWS } from '@defra-fish/connectors-lib'
const { docClient } = AWS.mock.results[0].value

jest.mock('../../config.js', () => ({
  db: {
    fileStagingTable: 'TestFileTable',
    recordStagingTable: 'TestRecordTable',
    stagingTtlDelta: 60 * 60 * 168
  }
}))

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    docClient: {
      batchWriteAllPromise: jest.fn(),
      get: jest.fn(() => ({ Item: undefined })),
      scanAllPromise: jest.fn(),
      update: jest.fn(),
      createUpdateExpression: jest.fn(() => ({})),
      queryAllPromise: jest.fn()
    }
  }))
}))

describe('database operations', () => {
  const TEST_FILENAME = 'testfile.xml'
  beforeEach(() => {
    jest.clearAllMocks()
  })
  describe('getFileRecord', () => {
    it('calls a get operation on dynamodb', async () => {
      await db.getFileRecord(TEST_FILENAME)
      expect(docClient.get).toHaveBeenCalledWith({
        TableName: 'TestFileTable',
        Key: { filename: TEST_FILENAME },
        ConsistentRead: true
      })
    })
  })

  describe('getFileRecords', () => {
    it('retrieves all records for the given file if no stages are provided', async () => {
      await db.getFileRecords()
      expect(docClient.scanAllPromise).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'TestFileTable',
          ConsistentRead: true
        })
      )
    })

    it('retrieves all records a given set of stages', async () => {
      await db.getFileRecords('STAGE 1', 'STAGE 2')
      expect(docClient.scanAllPromise).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'TestFileTable',
          FilterExpression: 'stage IN (:stage0,:stage1)',
          ExpressionAttributeValues: { ':stage0': 'STAGE 1', ':stage1': 'STAGE 2' },
          ConsistentRead: true
        })
      )
    })
  })

  describe('updateFileStagingTable', () => {
    it('calls update on dynamodb including all necessary parameters', async () => {
      docClient.createUpdateExpression.mockReturnValueOnce({
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
      })
      await db.updateFileStagingTable({ filename: TEST_FILENAME, param1: 'test1', param2: 'test2' })
      expect(docClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
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
        })
      )
    })
  })

  describe('updateRecordStagingTable', () => {
    it('calls batchWrite on dynamodb including all necessary parameters', async () => {
      const records = [{ id: 'test1' }, { id: 'test2' }]
      await db.updateRecordStagingTable(TEST_FILENAME, records)
      expect(docClient.batchWriteAllPromise).toHaveBeenCalledWith(
        expect.objectContaining({
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
      )
    })

    it('is a no-op if records is empty', async () => {
      await db.updateRecordStagingTable(TEST_FILENAME, [])
      expect(docClient.batchWriteAllPromise).not.toHaveBeenCalled()
    })
  })

  describe('getProcessedRecords', () => {
    it('retrieves all records for the given file if no stages are provided', async () => {
      await db.getProcessedRecords(TEST_FILENAME)
      expect(docClient.queryAllPromise).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'TestRecordTable',
          KeyConditionExpression: 'filename = :filename',
          ExpressionAttributeValues: { ':filename': TEST_FILENAME },
          ConsistentRead: true
        })
      )
    })

    it('retrieves all records a given set of stages', async () => {
      await db.getProcessedRecords(TEST_FILENAME, 'STAGE 1', 'STAGE 2')
      expect(docClient.queryAllPromise).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'TestRecordTable',
          KeyConditionExpression: 'filename = :filename',
          FilterExpression: 'stage IN (:stage0,:stage1)',
          ExpressionAttributeValues: { ':filename': TEST_FILENAME, ':stage0': 'STAGE 1', ':stage1': 'STAGE 2' },
          ConsistentRead: true
        })
      )
    })
  })
})
