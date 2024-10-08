import { s3ToLocal } from '../s3-to-local.js'
import stream from 'stream'
import AwsMock from 'aws-sdk'

const MOCK_TMP = '/tmp/local/mock'

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
    }))
  }
})

jest.mock('stream')
jest.mock('../../io/file.js', () => ({
  getTempDir: jest.fn((...subfolders) => `${MOCK_TMP}/${subfolders.join('/')}`)
}))

jest.mock('../../config.js', () => ({
  s3: {
    bucket: 'testbucket'
  }
}))

describe('s3-to-local', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    AwsMock.__resetAll()
  })

  it('retrieves a file from s3 for a given key', async () => {
    const mockCreateReadStream = jest.fn()
    AwsMock.S3.mockedMethods.getObject.mockImplementationOnce(() => {
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
    expect(AwsMock.S3.mockedMethods.getObject).toHaveBeenCalledWith({
      Bucket: 'testbucket',
      Key: '/example/testS3Key.xml'
    })
  })
})
