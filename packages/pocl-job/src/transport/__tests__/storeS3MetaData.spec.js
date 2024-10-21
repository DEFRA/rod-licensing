import moment from 'moment'
import { salesApi } from '@defra-fish/connectors-lib'
import { DYNAMICS_IMPORT_STAGE, FILE_STAGE, POST_OFFICE_DATASOURCE } from '../../staging/constants.js'
import { updateFileStagingTable } from '../../io/db.js'
import { storeS3Metadata } from '../storeS3MetaData.js'

jest.mock('../../io/db.js', () => ({
  updateFileStagingTable: jest.fn()
}))
jest.mock('@defra-fish/connectors-lib', () => ({
  salesApi: {
    upsertTransactionFile: jest.fn()
  }
}))

describe('storeS3Metadata', () => {
  const md5 = 'mockMd5Hash'
  const fileSize = 12345
  const filename = 'testfile'
  const s3Key = 'mock/s3/key/testfile'
  const receiptMoment = new Date('2024-10-17T00:00:00Z')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('console log should output "Storing metadata for s3Key"', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
    await storeS3Metadata(md5, fileSize, filename, s3Key, receiptMoment)
    expect(consoleLogSpy).toHaveBeenCalledWith(`Storing metadata for ${s3Key}`)
  })

  it('should call updateFileStagingTable with correct arguments', async () => {
    await storeS3Metadata(md5, fileSize, filename, s3Key, receiptMoment)
    expect(updateFileStagingTable).toHaveBeenCalledWith({
      filename,
      md5,
      fileSize,
      s3Key,
      stage: FILE_STAGE.Pending
    })
  })

  it('should call salesApi.upsertTransactionFile with correct arguments', async () => {
    const expectedSalesDate = moment(receiptMoment).subtract(1, 'days').toISOString()
    const expectedReceiptTimestamp = receiptMoment.toISOString()

    await storeS3Metadata(md5, fileSize, filename, s3Key, receiptMoment)
    expect(salesApi.upsertTransactionFile).toHaveBeenCalledWith(filename, {
      status: DYNAMICS_IMPORT_STAGE.Pending,
      dataSource: POST_OFFICE_DATASOURCE,
      fileSize: fileSize,
      salesDate: expectedSalesDate,
      receiptTimestamp: expectedReceiptTimestamp,
      notes: 'Retrieved from the remote server and awaiting processing'
    })
  })

  test('should log "Stored metadata for s3Key"', async () => {
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(jest.fn())
    await storeS3Metadata(md5, fileSize, filename, s3Key, receiptMoment)
    expect(consoleLogSpy).toHaveBeenCalledWith(`Stored metadata for ${s3Key}`)
  })
})
