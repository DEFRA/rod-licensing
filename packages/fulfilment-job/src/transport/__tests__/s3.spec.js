import { writeS3PartFile, readS3PartFiles, createS3WriteStream } from '../s3.js'
import stream from 'stream'
import { FulfilmentRequestFile } from '@defra-fish/dynamics-lib'
import { fulfilmentDataTransformer } from '../../transform/fulfilment-transform.js'
import { AWS } from '@defra-fish/connectors-lib'
const { mock: { results: [{ value: { s3 } }] } } = AWS

jest.mock('stream')
jest.mock('../../config.js', () => ({
  s3: {
    bucket: 'testbucket'
  }
}))
jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    s3: {
      getObject: jest.fn(() => ({
        createReadStream: jest.fn(() => ({
          setEncoding: jest.fn()
        }))
      })),
      listObjectsV2: jest.fn(async () => ({ Contents: [] })),
      upload: jest.fn(async () => ({ Location: 'The subterranean server room' }))
    }
  }))
}))

describe('s3', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('writeS3PartFile', () => {
    it('writes a part file to S3', async () => {
      const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
      const mockDataArray = []
      s3.upload.mockResolvedValueOnce({ Location: 'example.json/part0' })
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
      expect(s3.upload).toHaveBeenCalledWith({
        Bucket: 'testbucket',
        Key: 'example.json/part0',
        Body: expect.any(stream.PassThrough)
      })
    })
  })

  describe('readS3PartFiles', () => {
    describe('reads all part files for a given file and returns a stream for each', () => {
      beforeEach(() => {
        s3.listObjectsV2.mockResolvedValueOnce({
          Contents: [{ Key: '/example.json/part0' }, { Key: '/example.json/part1' }]
        })  
      })

      it('first stream matches createReadStream result from s3 object', async () => {
        const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
        const [stream1] = await readS3PartFiles(testFile)
        expect(s3.getObject.mock.results[0].value.createReadStream.mock.results[0].value).toBe(stream1)  
      })

      it('second stream matches createReadStream result from s3 object', async () => {
        const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
        const stream2 = (await readS3PartFiles(testFile))[1]
        expect(s3.getObject.mock.results[1].value.createReadStream.mock.results[0].value).toBe(stream2)
      })

      it('makes first call to s3.getObject with bucket details and first part file details', async () => {
        const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
        await readS3PartFiles(testFile)
        expect(s3.getObject).toHaveBeenNthCalledWith(1, { Bucket: 'testbucket', Key: '/example.json/part0' })
      })

      it('makes second call to s3.getObject with bucket details and second part file details', async () => {
        const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
        await readS3PartFiles(testFile)
        expect(s3.getObject).toHaveBeenNthCalledWith(2, { Bucket: 'testbucket', Key: '/example.json/part1' })
      })
    })

    it('sets encoding on readable stream', async () => {
      s3.listObjectsV2.mockResolvedValueOnce({
        Contents: [{ Key: '/example.json/part0' }]
      })
      const testFile = Object.assign(new FulfilmentRequestFile(), { fileName: 'example.json' })
      const [readStream] = await readS3PartFiles(testFile)
      expect(readStream.setEncoding).toHaveBeenCalledWith('utf8')
    })
  })

  describe('createS3WriteStream', () => {
    it('creates a writable stream to an object in S3', async () => {
      s3.upload.mockResolvedValueOnce(({ Location: 'example/key' }))
      const passThroughEmitSpy = jest.spyOn(stream.PassThrough.prototype, 'emit')
      const { s3WriteStream, managedUpload } = createS3WriteStream('example/key')
      await expect(managedUpload).resolves.toBeUndefined()

      expect(s3.upload).toHaveBeenCalledWith({
        Bucket: 'testbucket',
        Key: 'example/key',
        Body: expect.any(stream.PassThrough)
      })
      expect(s3WriteStream.write).toBeDefined()
      expect(passThroughEmitSpy).not.toHaveBeenCalled()
    })

    it('rejects the managed upload promise if an error occurs uploading', async () => {
      s3.upload.mockRejectedValueOnce(new Error('Test error'))
      const { s3WriteStream, managedUpload } = createS3WriteStream('example/key')
      await expect(managedUpload).rejects.toThrow('Test error')
      expect(s3.upload).toHaveBeenCalledWith({
        Bucket: 'testbucket',
        Key: 'example/key',
        Body: s3WriteStream
      })
    })
  })
})
