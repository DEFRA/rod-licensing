import { refreshS3Metadata } from '../s3'
import moment from 'moment'
import AwsMock from 'aws-sdk'

jest.mock('fs')
jest.mock('md5-file')

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
    it('gets a list of files from S3 and logs file processing', async () => {
      const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`
      const s3Key2 = `${moment().format('YYYY-MM-DD')}/test2.xml`

      AwsMock.S3.mockedMethods.listObjectsV2.mockReturnValueOnce({
        promise: () => ({
          IsTruncated: false,
          Contents: [
            { Key: s3Key1, LastModified: moment().toISOString() },
            { Key: s3Key2, LastModified: moment().toISOString() }
          ]
        })
      })
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      await refreshS3Metadata()

      expect(AwsMock.S3.mockedMethods.listObjectsV2).toHaveBeenNthCalledWith(1, {
        Bucket: 'testbucket',
        ContinuationToken: undefined
      })
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing 2 S3 files')
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing test1.xml')
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing test2.xml')
    })

    it('gets a truncated list of files from S3', async () => {
      const s3Key1 = `${moment().format('YYYY-MM-DD')}/test1.xml`

      AwsMock.S3.mockedMethods.listObjectsV2.mockReturnValueOnce({
        promise: () => ({
          IsTruncated: true,
          NextContinuationToken: 'token',
          Contents: [{ Key: s3Key1, LastModified: moment().toISOString() }]
        })
      })

      AwsMock.S3.mockedMethods.listObjectsV2.mockReturnValueOnce({
        promise: () => ({
          IsTruncated: false,
          Contents: [{ Key: s3Key1, LastModified: moment().toISOString() }]
        })
      })

      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      await refreshS3Metadata()

      expect(AwsMock.S3.mockedMethods.listObjectsV2).toHaveBeenNthCalledWith(1, {
        Bucket: 'testbucket',
        ContinuationToken: undefined
      })
      expect(AwsMock.S3.mockedMethods.listObjectsV2).toHaveBeenNthCalledWith(2, {
        Bucket: 'testbucket',
        ContinuationToken: 'token'
      })
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing 1 S3 files')
      expect(consoleLogSpy).toHaveBeenCalledWith('Processing test1.xml')
      expect(consoleLogSpy).toHaveBeenCalledTimes(3)
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
