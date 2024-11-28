import { writeS3PartFile, readS3PartFiles, createS3WriteStream } from '../s3.js'
import stream from 'stream'
import AwsMock from 'aws-sdk'
import { FulfilmentRequestFile } from '@defra-fish/dynamics-lib'
import { fulfilmentDataTransformer } from '../../transform/fulfilment-transform.js'

jest.mock('fs', () => {
  const originalFs = jest.requireActual('fs')
  return {
    ...originalFs,
    promises: {
      readFile: jest.fn().mockResolvedValue('mocked file content')
    }
  }
})

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
      AwsMock.S3.mockedMethods.upload.mockImplementationOnce(() => ({ promise: jest.fn(async () => ({ Location: 'example.json/part0' })) }))
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
      const mockCreateReadStream = createMockReadStream()
      AwsMock.S3.__setResponse('listObjectsV2', {
        Contents: [{ Key: '/example.json/part0' }, { Key: '/example.json/part1' }]
      })
      AwsMock.S3.mockedMethods.getObject.mockImplementation(() => ({ createReadStream: mockCreateReadStream }))

      const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
      const [stream1, stream2] = await readS3PartFiles(testFile)

      expect(mockCreateReadStream.mock.results[0].value).toBe(stream1)
      expect(mockCreateReadStream.mock.results[1].value).toBe(stream2)
      expect(AwsMock.S3.mockedMethods.getObject).toHaveBeenNthCalledWith(1, { Bucket: 'testbucket', Key: '/example.json/part0' })
      expect(AwsMock.S3.mockedMethods.getObject).toHaveBeenNthCalledWith(2, { Bucket: 'testbucket', Key: '/example.json/part1' })
    })

    it('sets encoding on readable stream', async () => {
      const mockCreateReadStream = createMockReadStream()
      AwsMock.S3.__setResponse('listObjectsV2', {
        Contents: [{ Key: '/example.json/part0' }]
      })
      AwsMock.S3.mockedMethods.getObject.mockImplementation(() => ({ createReadStream: mockCreateReadStream }))
      const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
      const [readStream] = await readS3PartFiles(testFile)
      expect(readStream.setEncoding).toHaveBeenCalledWith('utf8')
    })

    const createMockReadStream = () =>
      jest.fn(() => ({
        setEncoding: jest.fn()
      }))
  })

  describe('createS3WriteStream', () => {
    it('creates a writable stream to an object in S3', async () => {
      AwsMock.S3.mockedMethods.upload.mockImplementationOnce(() => ({ promise: jest.fn(async () => ({ Location: 'example/key' })) }))
      const passThroughEmitSpy = jest.spyOn(stream.PassThrough.prototype, 'emit')
      const { s3WriteStream, managedUpload } = createS3WriteStream('example/key')
      await expect(managedUpload).resolves.toBeUndefined()

      expect(AwsMock.S3.mockedMethods.upload).toHaveBeenCalledWith({
        Bucket: 'testbucket',
        Key: 'example/key',
        Body: expect.any(stream.PassThrough)
      })
      expect(s3WriteStream.write).toBeDefined()
      expect(passThroughEmitSpy).not.toHaveBeenCalled()
    })

    it('rejects the managed upload promise if an error occurs uploading', async () => {
      AwsMock.S3.mockedMethods.upload.mockImplementationOnce(() => ({
        promise: jest.fn(async () => {
          throw new Error('Test error')
        })
      }))
      const { s3WriteStream, managedUpload } = createS3WriteStream('example/key')
      await expect(managedUpload).rejects.toThrow('Test error')
      expect(AwsMock.S3.mockedMethods.upload).toHaveBeenCalledWith({
        Bucket: 'testbucket',
        Key: 'example/key',
        Body: s3WriteStream
      })
    })
  })
})
