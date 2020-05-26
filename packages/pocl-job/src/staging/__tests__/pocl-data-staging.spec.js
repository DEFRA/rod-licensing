import each from 'jest-each'
import Project from '../../project.cjs'
import { FILE_STAGE } from '../constants.js'
import { stage } from '../pocl-data-staging.js'
import { createTransactions } from '../create-transactions.js'
import { finaliseTransactions } from '../finalise-transactions.js'
import { getFileRecord, updateFileStagingTable } from '../../io/db.js'

jest.mock('../create-transactions.js')
jest.mock('../finalise-transactions.js')
jest.mock('../../io/db.js')

describe('pocl data staging', () => {
  const TEST_FILE_NAME = 'test-2-records.xml'
  const TEST_FILE_PATH = `${Project.root}/src/__mocks__/${TEST_FILE_NAME}`

  beforeAll(() => {
    process.env.POCL_FILE_STAGING_TABLE = 'TestFileTable'
  })
  beforeEach(jest.clearAllMocks)

  describe('it runs all stages if...', () => {
    each([
      ['the file has not previously been processed', undefined],
      ['the file has pending state', { stage: FILE_STAGE.Pending }]
    ]).it('%s', async (desc, val) => {
      getFileRecord.mockResolvedValue(val)
      createTransactions.mockResolvedValue({ succeeded: 5, failed: 1 })
      finaliseTransactions.mockResolvedValue({ succeeded: 3, failed: 2 })
      await stage(TEST_FILE_PATH)
      expect(getFileRecord).toHaveBeenCalledWith(TEST_FILE_NAME)
      expect(createTransactions).toHaveBeenCalledWith(TEST_FILE_PATH)
      expect(finaliseTransactions).toHaveBeenCalledWith(TEST_FILE_PATH)
      expect(updateFileStagingTable).toHaveBeenNthCalledWith(1, {
        filename: TEST_FILE_NAME,
        md5: expect.any(String),
        stage: FILE_STAGE.Staging
      })
      expect(updateFileStagingTable).toHaveBeenNthCalledWith(2, {
        filename: TEST_FILE_NAME,
        stage: FILE_STAGE.Finalising,
        stagingSucceeded: 5,
        stagingFailed: 1
      })
      expect(updateFileStagingTable).toHaveBeenNthCalledWith(3, {
        filename: TEST_FILE_NAME,
        stage: FILE_STAGE.Completed,
        finalisationSucceeded: 3,
        finalisationFailed: 2
      })
    })
  })

  it('only runs finalisation if the creation phase has previously been completed', async () => {
    getFileRecord.mockResolvedValue({ stage: FILE_STAGE.Finalising })
    finaliseTransactions.mockResolvedValue({ succeeded: 3, failed: 2 })
    await stage(TEST_FILE_PATH)
    expect(getFileRecord).toHaveBeenCalledWith(TEST_FILE_NAME)
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
    getFileRecord.mockResolvedValue({ stage: FILE_STAGE.Completed })
    await stage(TEST_FILE_PATH)
    expect(getFileRecord).toHaveBeenCalledWith(TEST_FILE_NAME)
    expect(createTransactions).not.toHaveBeenCalled()
    expect(finaliseTransactions).not.toHaveBeenCalled()
    expect(updateFileStagingTable).not.toHaveBeenCalled()
  })
})
