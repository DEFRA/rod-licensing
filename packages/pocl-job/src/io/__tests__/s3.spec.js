import { refreshS3Metadata } from '../s3'
import moment from 'moment'
import { updateFileStagingTable } from '../../io/db.js'
import { DYNAMICS_IMPORT_STAGE, FILE_STAGE, POST_OFFICE_DATASOURCE } from '../../staging/constants.js'
import { salesApi, AWS } from '@defra-fish/connectors-lib'
import fs from 'fs'
const { s3, ListObjectsV2Command } = AWS.mock.results[0].value

jest.mock('md5-file')
jest.mock('../../io/db.js')
jest.mock('../../io/file.js')

jest.mock('@defra-fish/connectors-lib', () => {
  const actual = jest.requireActual('@defra-fish/connectors-lib')
  const AWS = jest.fn(() => ({
    docClient: {
      update: jest.fn(),
      createUpdateExpression: jest.fn(() => ({}))
    },
    s3: {
      getObject: jest.fn(() => ({
        createReadStream: jest.fn()
      })),
      send: jest.fn()
    },
    ListObjectsV2Command: jest.fn()
  }))
  return {
    AWS,
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
  })

  describe('refreshS3Metadata', () => {
    describe('gets a list of files from S3', () => {
      const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`
      const s3Key2 = `${moment().format('YYYY-MM-DD')}/test2.xml`

      beforeEach(async () => {
        s3.send.mockReturnValueOnce({
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

        await refreshS3Metadata()
      })

      it('calls ListObjectsV2Command, with bucket name and no continuation token', () => {
        expect(ListObjectsV2Command).toHaveBeenNthCalledWith(1, {
          Bucket: 'testbucket',
          ContinuationToken: undefined
        })
      })

      it('calls updateFileStagingTable first with initial test file', () => {
        expect(updateFileStagingTable).toHaveBeenNthCalledWith(1, {
          filename: 'test1.xml',
          md5: 'example-md5',
          fileSize: '1 KB',
          stage: FILE_STAGE.Pending,
          s3Key: s3Key1
        })
      })

      it('calls updateFileStagingTable a second time with second test file', () => {
        expect(updateFileStagingTable).toHaveBeenNthCalledWith(2, {
          filename: 'test2.xml',
          md5: 'example-md5',
          fileSize: '2 KB',
          stage: FILE_STAGE.Pending,
          s3Key: s3Key2
        })
      })

      it('calls upsertTransactionFile for first test file', () => {
        expect(salesApi.upsertTransactionFile).toHaveBeenNthCalledWith(1, 'test1.xml', {
          status: DYNAMICS_IMPORT_STAGE.Pending,
          dataSource: POST_OFFICE_DATASOURCE,
          fileSize: '1 KB',
          receiptTimestamp: expect.any(String),
          salesDate: expect.any(String),
          notes: 'Retrieved from the remote server and awaiting processing'
        })
      })

      it('calls upsertTransactionFile for second test file', () => {
        expect(salesApi.upsertTransactionFile).toHaveBeenNthCalledWith(2, 'test2.xml', {
          status: DYNAMICS_IMPORT_STAGE.Pending,
          dataSource: POST_OFFICE_DATASOURCE,
          fileSize: '2 KB',
          receiptTimestamp: expect.any(String),
          salesDate: expect.any(String),
          notes: 'Retrieved from the remote server and awaiting processing'
        })
      })
    })

    describe('gets a truncated list of files from S3', () => {
      const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`

      beforeEach(async () => {
        s3.send
          .mockReturnValue({
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
          .mockReturnValueOnce({
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

        await refreshS3Metadata()
      })

      it('calls ListObjectsV2Command a first time with bucket name and no continuation token', () => {
        expect(ListObjectsV2Command).toHaveBeenNthCalledWith(1, {
          Bucket: 'testbucket',
          ContinuationToken: undefined
        })
      })

      it('calls ListObjectsV2Command a second time with bucket name and continuation token', () => {
        expect(ListObjectsV2Command).toHaveBeenNthCalledWith(2, {
          Bucket: 'testbucket',
          ContinuationToken: 'token'
        })
      })

      it('updates file staging table with first test file', () => {
        expect(updateFileStagingTable).toHaveBeenNthCalledWith(1, {
          filename: 'test1.xml',
          md5: 'example-md5',
          fileSize: '1 KB',
          stage: FILE_STAGE.Pending,
          s3Key: s3Key1
        })
      })

      it('updates file staging table with second test file', () => {
        expect(updateFileStagingTable).toHaveBeenNthCalledWith(2, {
          filename: 'test1.xml',
          md5: 'example-md5',
          fileSize: '1 KB',
          stage: FILE_STAGE.Pending,
          s3Key: s3Key1
        })
      })

      it('upserts sales api with transaction file details', () => {
        expect(salesApi.upsertTransactionFile).toHaveBeenNthCalledWith(1, 'test1.xml', {
          status: DYNAMICS_IMPORT_STAGE.Pending,
          dataSource: POST_OFFICE_DATASOURCE,
          fileSize: '1 KB',
          receiptTimestamp: expect.any(String),
          salesDate: expect.any(String),
          notes: 'Retrieved from the remote server and awaiting processing'
        })
      })
    })

    it('skips file processing if a file has already been marked as processed in Dynamics', async () => {
      jest.spyOn(fs, 'createReadStream').mockReturnValueOnce('teststream')
      jest.spyOn(fs, 'statSync').mockReturnValueOnce({ size: 1024 })
      salesApi.getTransactionFile.mockResolvedValueOnce({ status: { description: 'Processed' } })
      const s3Key = `${moment().format('YYYY-MM-DD')}/test-already-processed.xml`

      s3.send.mockReturnValueOnce({
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

      await refreshS3Metadata()

      expect(updateFileStagingTable).not.toHaveBeenCalled()
      expect(salesApi.upsertTransactionFile).not.toHaveBeenCalled()
    })

    it('skips file processing if a file is older than one week', async () => {
      const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`

      s3.send
        .mockReturnValue({
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
        .mockReturnValueOnce({
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

      await refreshS3Metadata()

      expect(updateFileStagingTable).not.toHaveBeenCalled()
      expect(salesApi.upsertTransactionFile).not.toHaveBeenCalled()
    })

    it('logs any errors raised by calling ListObjectsV2Command', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const testError = new Error('Test error')
      s3.send.mockRejectedValueOnce(testError)

      await expect(refreshS3Metadata()).rejects.toThrow(testError)
      expect(consoleErrorSpy).toHaveBeenCalledWith(testError)
    })

    it('raises a warning if the bucket is empty', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

      s3.send.mockReturnValueOnce({
        IsTruncated: false
      })

      await refreshS3Metadata()
      expect(consoleWarnSpy).toHaveBeenCalledWith('S3 bucket contains no objects')
    })
  })
})
