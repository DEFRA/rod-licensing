import { ftpToS3 } from '../ftp-to-s3.js'
import moment from 'moment'
import { updateFileStagingTable } from '../../io/db.js'
import { getTempDir } from '../../io/file.js'
import { FILE_STAGE } from '../../staging/constants.js'
import fs from 'fs'
import md5File from 'md5-file'
const ftpMock = require('ssh2-sftp-client')
const awsMock = require('aws-sdk').default

jest.mock('fs')
jest.mock('md5-file')
jest.mock('../../io/db.js')
jest.mock('../../io/file.js')

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
      stage: FILE_STAGE.Pending,
      s3Key: s3Key1
    })
    expect(updateFileStagingTable).toHaveBeenNthCalledWith(2, {
      filename: 'test2.xml',
      md5: 'example-md5',
      stage: FILE_STAGE.Pending,
      s3Key: s3Key2
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
