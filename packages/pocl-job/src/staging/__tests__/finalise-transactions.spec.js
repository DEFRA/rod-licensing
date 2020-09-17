import { finaliseTransactions } from '../finalise-transactions.js'
import { RECORD_STAGE, MAX_FINALISE_TRANSACTION_BATCH_SIZE } from '../constants.js'
import * as db from '../../io/db.js'
import { salesApi } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    ...Object.keys(jest.requireActual('@defra-fish/connectors-lib').salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn() }), {}),
    isSystemError: jest.requireActual('@defra-fish/connectors-lib').salesApi.isSystemError
  }
}))
jest.mock('../../io/db.js', () => ({
  updateRecordStagingTable: jest.fn(),
  getProcessedRecords: jest.fn(() => [])
}))

describe('finalise-transactions', () => {
  const TEST_FILENAME = 'testfile.xml'
  beforeAll(() => {
    process.env.POCL_FILE_STAGING_TABLE = 'TestFileTable'
    process.env.POCL_RECORD_STAGING_TABLE = 'TestRecordTable'
  })
  beforeEach(jest.clearAllMocks)

  it('updates records appropriately validation error occurs on finalisation', async () => {
    const fakeApiError = { status: 422, error: 'Fake error', message: 'Fake error message' }
    db.getProcessedRecords.mockReturnValueOnce([
      { id: 'test1', stage: RECORD_STAGE.TransactionCreated },
      { id: 'test2', stage: RECORD_STAGE.TransactionCreated }
    ])
    salesApi.finaliseTransaction.mockResolvedValueOnce({ status: { id: 'FINALISED', messageId: 'message1' } })
    salesApi.finaliseTransaction.mockRejectedValueOnce(fakeApiError)
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(2)
    expect(db.updateRecordStagingTable).toHaveBeenNthCalledWith(1, TEST_FILENAME, [
      { id: 'test1', stage: RECORD_STAGE.TransactionFinalised, finaliseTransactionId: 'message1' }
    ])
    expect(db.updateRecordStagingTable).toHaveBeenNthCalledWith(2, TEST_FILENAME, [
      { id: 'test2', stage: RECORD_STAGE.TransactionFinalisationFailed, finaliseTransactionError: fakeApiError }
    ])
    expect(salesApi.createStagingException).toHaveBeenCalledWith({
      transactionFileException: {
        name: 'testfile.xml: FAILED-FINALISE-test2',
        description: JSON.stringify(fakeApiError, null, 2),
        json: expect.any(String),
        transactionFile: 'testfile.xml',
        type: 'Failure',
        notes: 'Failed to finalise the transaction in the Sales API'
      }
    })
  })

  it('treats 410 Gone errors from the Sales API as a success', async () => {
    const fakeApiError = {
      status: 410,
      error: 'Gone',
      message: 'The transaction has already been finalised',
      body: {
        data: { status: { id: 'FINALISED', messageId: 'message2' } }
      }
    }
    db.getProcessedRecords.mockReturnValueOnce([
      { id: 'test1', stage: RECORD_STAGE.TransactionCreated },
      { id: 'test2', stage: RECORD_STAGE.TransactionCreated }
    ])
    salesApi.finaliseTransaction.mockResolvedValueOnce({ status: { id: 'FINALISED', messageId: 'message1' } })
    salesApi.finaliseTransaction.mockRejectedValueOnce(fakeApiError)
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(2)
    expect(db.updateRecordStagingTable).toHaveBeenCalledTimes(2)
    // 1st call to update record staging table for successful transactions
    expect(db.updateRecordStagingTable).toHaveBeenCalledWith(TEST_FILENAME, [
      { id: 'test1', stage: RECORD_STAGE.TransactionFinalised, finaliseTransactionId: 'message1' },
      { id: 'test2', stage: RECORD_STAGE.TransactionFinalised, finaliseTransactionId: 'message2' }
    ])
    // 2nd call to update record staging table for failed transactions (empty for this case)
    expect(db.updateRecordStagingTable).toHaveBeenNthCalledWith(2, TEST_FILENAME, [])
    expect(salesApi.createStagingException).not.toHaveBeenCalled()
  })

  it('throws an exception if a system error occurs on finalisation', async () => {
    const fakeApiError = { status: 500, error: 'System error', message: 'System error message' }
    db.getProcessedRecords.mockReturnValueOnce([
      { id: 'test1', stage: RECORD_STAGE.TransactionCreated },
      { id: 'test2', stage: RECORD_STAGE.TransactionCreated }
    ])
    salesApi.finaliseTransaction.mockResolvedValueOnce({ status: { id: 'FINALISED', messageId: 'message1' } })
    salesApi.finaliseTransaction.mockRejectedValueOnce(fakeApiError)
    await expect(finaliseTransactions(TEST_FILENAME)).rejects.toThrow('')
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(2)
    expect(db.updateRecordStagingTable).toHaveBeenNthCalledWith(1, TEST_FILENAME, [
      { id: 'test1', stage: RECORD_STAGE.TransactionFinalised, finaliseTransactionId: 'message1' }
    ])
    expect(db.updateRecordStagingTable).toHaveBeenNthCalledWith(2, TEST_FILENAME, [])
    expect(salesApi.createStagingException).not.toHaveBeenCalled()
  })

  it('will resume finalising records if the process was previously interrupted', async () => {
    db.getProcessedRecords.mockReturnValueOnce([
      { id: 'test1', stage: RECORD_STAGE.TransactionFinalised },
      { id: 'test2', stage: RECORD_STAGE.TransactionFinalisationFailed },
      { id: 'test3', stage: RECORD_STAGE.TransactionCreated }
    ])
    salesApi.finaliseTransaction.mockResolvedValue({ status: { id: 'FINALISED', messageId: `message-${Math.random()}` } })
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(1)
    expect(db.updateRecordStagingTable).toHaveBeenCalledTimes(2)
    expect(db.updateRecordStagingTable).toHaveBeenNthCalledWith(1, TEST_FILENAME, [
      { id: 'test3', stage: RECORD_STAGE.TransactionFinalised, finaliseTransactionId: expect.any(String) }
    ])
    expect(db.updateRecordStagingTable).toHaveBeenNthCalledWith(2, TEST_FILENAME, [])
  })

  it(`calls finalisation in batches of ${MAX_FINALISE_TRANSACTION_BATCH_SIZE}`, async () => {
    db.getProcessedRecords.mockReturnValueOnce(
      Array(MAX_FINALISE_TRANSACTION_BATCH_SIZE + 1).fill({ id: `test-${Math.random()}`, stage: RECORD_STAGE.TransactionCreated })
    )
    salesApi.finaliseTransaction.mockResolvedValue({ status: { id: 'FINALISED', messageId: `message-${Math.random()}` } })
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(MAX_FINALISE_TRANSACTION_BATCH_SIZE + 1)
    expect(db.updateRecordStagingTable).toHaveBeenCalledTimes(4)
  })

  it('is a no-op if no records require finalisation', async () => {
    await finaliseTransactions(TEST_FILENAME)
    expect(salesApi.finaliseTransaction).not.toHaveBeenCalled()
    expect(db.updateRecordStagingTable).not.toHaveBeenCalled()
  })
})
