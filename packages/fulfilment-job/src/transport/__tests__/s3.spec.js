import { writeS3PartFile, readS3PartFiles, createS3WriteStream } from '../s3.js'
import stream from 'stream'
import AwsMock from 'aws-sdk'
import { FulfilmentRequestFile } from '@defra-fish/dynamics-lib'
import { fulfilmentDataTransformer } from '../../transform/fulfilment-transform.js'

jest.mock('fs')
jest.mock('stream')
jest.mock('../../config.js', () => ({
  s3: {
    bucket: 'testbucket'
  }
}))

describe('s3', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    AwsMock.__resetAll()
  })

  describe('writeS3PartFile', () => {
    it('writes a part file to S3', async () => {
      const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
      const mockDataArray = []
      AwsMock.S3.mockedMethods.upload.mockImplementationOnce(() => ({ send: jest.fn() }))
      stream.pipeline.mockImplementation(
        jest.fn((streams, callback) => {
          expect(streams[0]).toStrictEqual(mockDataArray)
          expect(streams[1]).toStrictEqual(fulfilmentDataTransformer)
          expect(streams[2]).toStrictEqual(expect.any(stream.PassThrough))
          callback()
        })
      )
      await writeS3PartFile(testFile, 0, [])
      expect(stream.pipeline).toHaveBeenCalled()
      expect(AwsMock.S3.mockedMethods.upload).toHaveBeenCalledWith({
        Bucket: 'testbucket',
        Key: 'example.json/part0',
        Body: expect.any(stream.PassThrough)
      })
    })
  })

  describe('readS3PartFiles', () => {
    it('reads all part files for a given file and returns a stream for each', async () => {
      const mockCreateReadStream1 = jest.fn(() => 'mockStream1')
      const mockCreateReadStream2 = jest.fn(() => 'mockStream2')
      AwsMock.S3.__setResponse('listObjectsV2', {
        Contents: [{ Key: '/example.json/part0' }, { Key: '/example.json/part1' }]
      })
      AwsMock.S3.mockedMethods.getObject.mockImplementationOnce(() => ({ createReadStream: mockCreateReadStream1 }))
      AwsMock.S3.mockedMethods.getObject.mockImplementationOnce(() => ({ createReadStream: mockCreateReadStream2 }))

      const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
      const streams = await readS3PartFiles(testFile)
      expect(streams).toStrictEqual(['mockStream1', 'mockStream2'])
      expect(AwsMock.S3.mockedMethods.getObject).toHaveBeenNthCalledWith(1, { Bucket: 'testbucket', Key: '/example.json/part0' })
      expect(AwsMock.S3.mockedMethods.getObject).toHaveBeenNthCalledWith(2, { Bucket: 'testbucket', Key: '/example.json/part1' })
    })
  })

  describe('createS3WriteStream', () => {
    it('creates a writable stream to an object in S3', async () => {
      AwsMock.S3.mockedMethods.upload.mockImplementationOnce(() => ({
        send: jest.fn(callback => callback(null, { Location: 'example/key' }))
      }))
      const passThroughEmitSpy = jest.spyOn(stream.PassThrough.prototype, 'emit')
      const writableStream = await createS3WriteStream('example/key')
      expect(AwsMock.S3.mockedMethods.upload).toHaveBeenCalledWith({
        Bucket: 'testbucket',
        Key: 'example/key',
        Body: expect.any(stream.PassThrough)
      })
      expect(writableStream.write).toBeDefined()
      expect(passThroughEmitSpy).not.toHaveBeenCalled()
    })
    it('emits an error to the stream if an error occurs uploading', async () => {
      const testError = new Error('Test error')
      AwsMock.S3.mockedMethods.upload.mockImplementationOnce(() => ({ send: jest.fn(callback => callback(testError)) }))
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
      const writableStream = await createS3WriteStream('example/key')
      expect(AwsMock.S3.mockedMethods.upload).toHaveBeenCalledWith({
        Bucket: 'testbucket',
        Key: 'example/key',
        Body: expect.any(stream.PassThrough)
      })
      expect(writableStream.emit).toHaveBeenCalledWith('error', testError)
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
