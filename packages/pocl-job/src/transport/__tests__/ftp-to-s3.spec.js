import { ftpToS3 } from '../ftp-to-s3.js'
import moment from 'moment'
import { updateFileStagingTable } from '../../io/db.js'
import { getTempDir } from '../../io/file.js'
import { DYNAMICS_IMPORT_STAGE, FILE_STAGE, POST_OFFICE_DATASOURCE } from '../../staging/constants.js'
import { salesApi } from '@defra-fish/connectors-lib'
import fs from 'fs'
import md5File from 'md5-file'

const ftpMock = require('ssh2-sftp-client')
const awsMock = require('aws-sdk').default

jest.mock('fs')
jest.mock('md5-file')
jest.mock('../../io/db.js')
jest.mock('../../io/file.js')

jest.mock('@defra-fish/connectors-lib', () => {
  const actual = jest.requireActual('@defra-fish/connectors-lib')
  return {
    AWS: actual.AWS,
    salesApi: {
      ...Object.keys(actual.salesApi).reduce((acc, k) => ({ ...acc, [k]: jest.fn(async () => {}) }), {})
    }
  }
})

describe('ftp-to-s3', () => {
  beforeAll(() => {
    process.env.POCL_FTP_PATH = '/ftpservershare/'
    process.env.POCL_S3_BUCKET = 'testbucket'
    getTempDir.mockReturnValue('/local/tmp')
    md5File.mockResolvedValue('example-md5')
  })
  beforeEach(() => {
    jest.clearAllMocks()
    awsMock.__resetAll()
  })

  it('retrieves files from SFTP and stores in S3', async () => {
    ftpMock.mockedMethods.list.mockResolvedValue([{ name: 'test1.xml' }, { name: 'test2.xml' }])
    fs.createReadStream.mockReturnValueOnce('test1stream')
    fs.createReadStream.mockReturnValueOnce('test2stream')
    fs.statSync.mockReturnValueOnce({ size: 1024 })
    fs.statSync.mockReturnValueOnce({ size: 2048 })
    await ftpToS3()

    const localPath1 = '/local/tmp/test1.xml'
    const localPath2 = '/local/tmp/test2.xml'

    const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`
    const s3Key2 = `${moment().format('YYYY-MM-DD')}/test2.xml`

    expect(ftpMock.mockedMethods.fastGet).toHaveBeenNthCalledWith(1, '/ftpservershare/test1.xml', localPath1, {})
    expect(ftpMock.mockedMethods.fastGet).toHaveBeenNthCalledWith(2, '/ftpservershare/test2.xml', localPath2, {})
    expect(awsMock.S3.mockedMethods.putObject).toHaveBeenNthCalledWith(1, {
      Bucket: process.env.POCL_S3_BUCKET,
      Key: s3Key1,
      Body: 'test1stream'
    })
    expect(awsMock.S3.mockedMethods.putObject).toHaveBeenNthCalledWith(2, {
      Bucket: process.env.POCL_S3_BUCKET,
      Key: s3Key2,
      Body: 'test2stream'
    })
    expect(updateFileStagingTable).toHaveBeenNthCalledWith(1, {
      filename: 'test1.xml',
      md5: 'example-md5',
      fileSize: '1 KB',
      stage: FILE_STAGE.Pending,
      s3Key: s3Key1
    })
    expect(updateFileStagingTable).toHaveBeenNthCalledWith(2, {
      filename: 'test2.xml',
      md5: 'example-md5',
      fileSize: '2 KB',
      stage: FILE_STAGE.Pending,
      s3Key: s3Key2
    })
    expect(salesApi.upsertTransactionFile).toHaveBeenNthCalledWith(1, 'test1.xml', {
      status: DYNAMICS_IMPORT_STAGE.Pending,
      dataSource: POST_OFFICE_DATASOURCE,
      fileSize: '1 KB',
      receiptTimestamp: expect.any(String),
      salesDate: expect.any(String),
      notes: 'Retrieved from the remote server and awaiting processing'
    })
    expect(salesApi.upsertTransactionFile).toHaveBeenNthCalledWith(2, 'test2.xml', {
      status: DYNAMICS_IMPORT_STAGE.Pending,
      dataSource: POST_OFFICE_DATASOURCE,
      fileSize: '2 KB',
      receiptTimestamp: expect.any(String),
      salesDate: expect.any(String),
      notes: 'Retrieved from the remote server and awaiting processing'
    })
    expect(fs.unlinkSync).toHaveBeenNthCalledWith(1, localPath1)
    expect(fs.unlinkSync).toHaveBeenNthCalledWith(2, localPath2)
    expect(ftpMock.mockedMethods.end).toHaveBeenCalledTimes(1)
  })

  it('logs and propogates errors back up the stack', async () => {
    const testError = new Error('Test error')
    ftpMock.mockedMethods.list.mockRejectedValue(testError)
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    await expect(ftpToS3).rejects.toThrow(testError)
    expect(consoleErrorSpy).toHaveBeenCalled()
  })

  it('ignores non-xml files', async () => {
    ftpMock.mockedMethods.list.mockResolvedValue([{ name: 'test1.pdf' }, { name: 'test2.md' }])
    await ftpToS3()
    expect(ftpMock.mockedMethods.fastGet).not.toHaveBeenCalled()
    expect(awsMock.S3.mockedMethods.putObject).not.toHaveBeenCalled()
    expect(fs.unlinkSync).not.toHaveBeenCalled()
    expect(ftpMock.mockedMethods.end).toHaveBeenCalledTimes(1)
  })
})
