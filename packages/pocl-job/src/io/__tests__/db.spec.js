import * as db from '../db.js'
const awsMock = require('aws-sdk').default

describe('database operations', () => {
  const TEST_FILENAME = 'testfile.xml'

  beforeAll(() => {
    process.env.POCL_FILE_STAGING_TABLE = 'TestFileTable'
    process.env.POCL_RECORD_STAGING_TABLE = 'TestRecordTable'
  })
  beforeEach(() => {
    jest.clearAllMocks()
    awsMock.__resetAll()
  })
  describe('getFileRecord', () => {
    it('calls a get operation on dynamodb', async () => {
      await db.getFileRecord(TEST_FILENAME)
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.get).toHaveBeenCalledWith({
        TableName: process.env.POCL_FILE_STAGING_TABLE,
        Key: { filename: TEST_FILENAME },
        ConsistentRead: true
      })
    })
  })

  describe('getFileRecords', () => {
    it('retrieves all records for the given file if no stages are provided', async () => {
      await db.getFileRecords()
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.scan).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: process.env.POCL_FILE_STAGING_TABLE,
          ConsistentRead: true
        })
      )
    })

    it('retrieves all records a given set of stages', async () => {
      await db.getFileRecords('STAGE 1', 'STAGE 2')
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.scan).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: process.env.POCL_FILE_STAGING_TABLE,
          FilterExpression: 'stage IN (:stage0,:stage1)',
          ExpressionAttributeValues: { ':stage0': 'STAGE 1', ':stage1': 'STAGE 2' },
          ConsistentRead: true
        })
      )
    })
  })

  describe('updateFileStagingTable', () => {
    it('calls update on dynamodb including all necessary parameters', async () => {
      await db.updateFileStagingTable({ filename: TEST_FILENAME, param1: 'test1', param2: 'test2' })
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.update).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: 'TestFileTable',
          Key: { filename: TEST_FILENAME },
          UpdateExpression: 'SET expires = :expires,param1 = :param1,param2 = :param2',
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
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.batchWrite).toHaveBeenCalledWith(
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
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.batchWrite).not.toHaveBeenCalled()
    })
  })

  describe('getProcessedRecords', () => {
    it('retrieves all records for the given file if no stages are provided', async () => {
      await db.getProcessedRecords(TEST_FILENAME)
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.query).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: process.env.POCL_RECORD_STAGING_TABLE,
          KeyConditionExpression: 'filename = :filename',
          ExpressionAttributeValues: { ':filename': TEST_FILENAME },
          ConsistentRead: true
        })
      )
    })

    it('retrieves all records a given set of stages', async () => {
      await db.getProcessedRecords(TEST_FILENAME, 'STAGE 1', 'STAGE 2')
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.query).toHaveBeenCalledWith(
        expect.objectContaining({
          TableName: process.env.POCL_RECORD_STAGING_TABLE,
          KeyConditionExpression: 'filename = :filename',
          FilterExpression: 'stage IN (:stage0,:stage1)',
          ExpressionAttributeValues: { ':filename': TEST_FILENAME, ':stage0': 'STAGE 1', ':stage1': 'STAGE 2' },
          ConsistentRead: true
        })
      )
    })
  })
})
