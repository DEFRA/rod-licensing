import { refreshS3Metadata } from '../s3'
import moment from 'moment'
import { updateFileStagingTable } from '../../io/db.js'
import { DYNAMICS_IMPORT_STAGE, FILE_STAGE, POST_OFFICE_DATASOURCE } from '../../staging/constants.js'
import { salesApi } from '@defra-fish/connectors-lib'
import fs from 'fs'
import AwsMock from 'aws-sdk'

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs')
  return {
    ...originalFs,
    promises: {
      readFile: jest.fn().mockResolvedValue('mocked file content')
    },
    createWriteStream: jest.fn(() => ({
      on: jest.fn(),
      end: jest.fn()
    })),
    createReadStream: jest.fn(() => 'mocked stream'),
    statSync: jest.fn(() => ({ size: 1024 }))
  }
})

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

jest.mock('../../config.js', () => ({
  ftp: {
    path: '/ftpservershare/'
  },
  s3: {
    bucket: 'testbucket'
  }
}))
describe('s3 operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    AwsMock.__resetAll()
  })

  describe('refreshS3Metadata', () => {
    it('gets a list of files from S3', async () => {
      const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`
      const s3Key2 = `${moment().format('YYYY-MM-DD')}/test2.xml`

      AwsMock.S3.mockedMethods.listObjectsV2.mockReturnValueOnce({
        promise: () => ({
          IsTruncated: false,
          Contents: [
            {
              Key: s3Key1,
              LastModified: moment().toISOString(),
              ETag: 'example-md5',
              Size: 1024
            },
            {
              Key: s3Key2,
              LastModified: moment().toISOString(),
              ETag: 'example-md5',
              Size: 2048
            }
          ]
        })
      })

      await refreshS3Metadata()

      expect(AwsMock.S3.mockedMethods.listObjectsV2).toHaveBeenNthCalledWith(1, {
        Bucket: 'testbucket',
        ContinuationToken: undefined
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
    })

    it('gets a truncated list of files from S3', async () => {
      const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`

      AwsMock.S3.mockedMethods.listObjectsV2
        .mockReturnValue({
          promise: () => ({
            IsTruncated: false,
            Contents: [
              {
                Key: s3Key1,
                LastModified: moment().toISOString(),
                ETag: 'example-md5',
                Size: 1024
              }
            ]
          })
        })
        .mockReturnValueOnce({
          promise: () => ({
            IsTruncated: true,
            NextContinuationToken: 'token',
            Contents: [
              {
                Key: s3Key1,
                LastModified: moment().toISOString(),
                ETag: 'example-md5',
                Size: 1024
              }
            ]
          })
        })

      await refreshS3Metadata()

      expect(AwsMock.S3.mockedMethods.listObjectsV2).toHaveBeenNthCalledWith(1, {
        Bucket: 'testbucket',
        ContinuationToken: undefined
      })
      expect(AwsMock.S3.mockedMethods.listObjectsV2).toHaveBeenNthCalledWith(2, {
        Bucket: 'testbucket',
        ContinuationToken: 'token'
      })
      expect(updateFileStagingTable).toHaveBeenNthCalledWith(1, {
        filename: 'test1.xml',
        md5: 'example-md5',
        fileSize: '1 KB',
        stage: FILE_STAGE.Pending,
        s3Key: s3Key1
      })
      expect(salesApi.upsertTransactionFile).toHaveBeenNthCalledWith(1, 'test1.xml', {
        status: DYNAMICS_IMPORT_STAGE.Pending,
        dataSource: POST_OFFICE_DATASOURCE,
        fileSize: '1 KB',
        receiptTimestamp: expect.any(String),
        salesDate: expect.any(String),
        notes: 'Retrieved from the remote server and awaiting processing'
      })
    })

    it('skips file processing if a file has already been marked as processed in Dynamics', async () => {
      fs.createReadStream.mockReturnValueOnce('teststream')
      fs.statSync.mockReturnValueOnce({ size: 1024 })
      salesApi.getTransactionFile.mockResolvedValueOnce({ status: { description: 'Processed' } })
      const s3Key = `${moment().format('YYYY-MM-DD')}/test-already-processed.xml`

      AwsMock.S3.mockedMethods.listObjectsV2.mockReturnValueOnce({
        promise: () => ({
          IsTruncated: false,
          Contents: [
            {
              Key: s3Key,
              LastModified: moment().toISOString(),
              ETag: 'example-md5',
              Size: 1024
            }
          ]
        })
      })

      await refreshS3Metadata()

      expect(updateFileStagingTable).not.toHaveBeenCalled()
      expect(salesApi.upsertTransactionFile).not.toHaveBeenCalled()
    })

    it('skips file processing if a file is older than one week', async () => {
      const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`

      AwsMock.S3.mockedMethods.listObjectsV2
        .mockReturnValue({
          promise: () => ({
            IsTruncated: false,
            Contents: [
              {
                Key: s3Key1,
                LastModified: moment().subtract(1, 'days').toISOString(),
                ETag: 'example-md5',
                Size: 1024
              }
            ]
          })
        })
        .mockReturnValueOnce({
          promise: () => ({
            IsTruncated: true,
            NextContinuationToken: 'token',
            Contents: [
              {
                Key: s3Key1,
                LastModified: moment().subtract(1, 'days').toISOString(),
                ETag: 'example-md5',
                Size: 1024
              }
            ]
          })
        })

      await refreshS3Metadata()

      expect(updateFileStagingTable).not.toHaveBeenCalled()
      expect(salesApi.upsertTransactionFile).not.toHaveBeenCalled()
    })

    it('logs any errors raised by calling s3.listObjectsV2', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const testError = new Error('Test error')
      AwsMock.S3.mockedMethods.listObjectsV2.mockReturnValue({
        promise: () => {
          throw testError
        }
      })

      await expect(refreshS3Metadata()).rejects.toThrow(testError)
      expect(consoleErrorSpy).toHaveBeenCalledWith(testError)
    })

    it('raises a warning if the bucket is empty', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      AwsMock.S3.mockedMethods.listObjectsV2.mockReturnValueOnce({
        promise: () => ({
          IsTruncated: false
        })
      })

      await refreshS3Metadata()
      expect(consoleWarnSpy).toHaveBeenCalledWith('S3 bucket contains no objects')
    })
  })
})
