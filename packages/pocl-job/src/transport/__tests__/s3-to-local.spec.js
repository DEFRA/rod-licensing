import { s3ToLocal } from '../s3-to-local.js'
import { getTempDir } from '../../io/file.js'
import stream from 'stream'
const awsMock = require('aws-sdk').default

jest.mock('fs')
jest.mock('stream')
jest.mock('../../io/file.js')

describe('s3-to-local', () => {
  beforeAll(() => {
    process.env.POCL_S3_BUCKET = 'testbucket'
    getTempDir.mockReturnValue('/local/tmp')
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
    expect(result).toBe('/local/tmp/example/testS3Key.xml')
    expect(mockCreateReadStream).toHaveBeenCalled()
    expect(stream.pipeline).toHaveBeenCalled()
    expect(awsMock.S3.mockedMethods.getObject).toHaveBeenCalledWith({
      Bucket: process.env.POCL_S3_BUCKET,
      Key: '/example/testS3Key.xml'
    })
  })
})
