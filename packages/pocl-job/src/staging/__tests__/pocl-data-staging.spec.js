import Project from '../../project.cjs'
import { stage } from '../pocl-data-staging.js'
import { FILE_STAGE } from '../constants.js'
import { createTransactions } from '../create-transactions.js'
import { finaliseTransactions } from '../finalise-transactions.js'
import { updateFileStagingTable } from '../db.js'

jest.mock('../create-transactions.js')
jest.mock('../finalise-transactions.js')
jest.mock('../db.js')
const awsMock = require('aws-sdk').default

describe('pocl data staging', () => {
  const TEST_FILE_NAME = 'test-2-records.xml'
  const TEST_FILE_PATH = `${Project.root}/src/__mocks__/${TEST_FILE_NAME}`

  beforeAll(() => {
    process.env.POCL_FILE_STAGING_TABLE = 'TestFileTable'
  })
  beforeEach(() => {
    awsMock.__resetAll()
    jest.clearAllMocks()
  })

  it('runs all stages if the file has not previously been processed', async () => {
    awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: undefined })
    createTransactions.mockReturnValue({ succeeded: 5, failed: 1 })
    finaliseTransactions.mockReturnValue({ succeeded: 3, failed: 2 })
    await stage(TEST_FILE_PATH)
    expect(awsMock.DynamoDB.DocumentClient.mockedMethods.get).toHaveBeenCalledWith({
      TableName: process.env.POCL_FILE_STAGING_TABLE,
      Key: { filename: TEST_FILE_NAME },
      ConsistentRead: true
    })
    expect(createTransactions).toHaveBeenCalledWith(TEST_FILE_PATH)
    expect(finaliseTransactions).toHaveBeenCalledWith(TEST_FILE_PATH)
    expect(updateFileStagingTable).toHaveBeenNthCalledWith(1, {
      filename: TEST_FILE_NAME,
      stage: FILE_STAGE.Finalising,
      stagingSucceeded: 5,
      stagingFailed: 1
    })
    expect(updateFileStagingTable).toHaveBeenNthCalledWith(2, {
      filename: TEST_FILE_NAME,
      stage: FILE_STAGE.Completed,
      finalisationSucceeded: 3,
      finalisationFailed: 2
    })
  })

  it('only runs finalisation if the creation phase has previously been completed', async () => {
    awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: { stage: FILE_STAGE.Finalising } })
    finaliseTransactions.mockReturnValue({ succeeded: 3, failed: 2 })
    await stage(TEST_FILE_PATH)
    expect(awsMock.DynamoDB.DocumentClient.mockedMethods.get).toHaveBeenCalledWith({
      TableName: process.env.POCL_FILE_STAGING_TABLE,
      Key: { filename: TEST_FILE_NAME },
      ConsistentRead: true
    })
    expect(createTransactions).not.toHaveBeenCalled()
    expect(finaliseTransactions).toHaveBeenCalledWith(TEST_FILE_PATH)
    expect(updateFileStagingTable).toHaveBeenCalledWith({
      filename: TEST_FILE_NAME,
      stage: FILE_STAGE.Completed,
      finalisationSucceeded: 3,
      finalisationFailed: 2
    })
  })

  it('is a no-op if the file has already been processed', async () => {
    awsMock.DynamoDB.DocumentClient.__setResponse('get', { Item: { stage: FILE_STAGE.Completed } })
    await stage(TEST_FILE_PATH)
    expect(awsMock.DynamoDB.DocumentClient.mockedMethods.get).toHaveBeenCalledWith({
      TableName: process.env.POCL_FILE_STAGING_TABLE,
      Key: { filename: TEST_FILE_NAME },
      ConsistentRead: true
    })
    expect(createTransactions).not.toHaveBeenCalled()
    expect(finaliseTransactions).not.toHaveBeenCalled()
    expect(updateFileStagingTable).not.toHaveBeenCalled()
  })
})
