import { s3ToLocal } from '../s3-to-local.js'
import stream from 'stream'
const awsMock = require('aws-sdk').default

const MOCK_TMP = '/tmp/local/mock'
jest.mock('fs')
jest.mock('stream')
jest.mock('../../io/file.js', () => ({
  getTempDir: jest.fn((...subfolders) => `${MOCK_TMP}/${subfolders.join('/')}`)
}))

describe('s3-to-local', () => {
  beforeAll(() => {
    process.env.POCL_S3_BUCKET = 'testbucket'
  })
  beforeEach(() => {
    jest.clearAllMocks()
    awsMock.__resetAll()
  })

  it('retrieves a file from s3 for a given key', async () => {
    const mockCreateReadStream = jest.fn()
    awsMock.S3.mockedMethods.getObject.mockImplementationOnce(() => {
      return { createReadStream: mockCreateReadStream }
    })
    stream.pipeline.mockImplementation(
      jest.fn((streams, callback) => {
        callback()
      })
    )

    const result = await s3ToLocal('/example/testS3Key.xml')
    expect(result).toBe(`${MOCK_TMP}/example/testS3Key.xml`)
    expect(mockCreateReadStream).toHaveBeenCalled()
    expect(stream.pipeline).toHaveBeenCalled()
    expect(awsMock.S3.mockedMethods.getObject).toHaveBeenCalledWith({
      Bucket: process.env.POCL_S3_BUCKET,
      Key: '/example/testS3Key.xml'
    })
  })
})
