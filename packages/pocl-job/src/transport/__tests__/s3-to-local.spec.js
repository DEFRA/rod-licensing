import { s3ToLocal } from '../s3-to-local.js'
import stream from 'stream'
import { AWS } from '@defra-fish/connectors-lib'
import fs from 'fs'
const { s3 } = AWS.mock.results[0].value

const MOCK_TMP = '/tmp/local/mock'
jest.mock('stream')
jest.mock('../../io/file.js', () => ({
  getTempDir: jest.fn((...subfolders) => `${MOCK_TMP}/${subfolders.join('/')}`)
}))

jest.mock('../../config.js', () => ({
  s3: {
    bucket: 'testbucket'
  }
}))

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    s3: {
      getObject: jest.fn(() => ({
        createReadStream: jest.fn(() => ({}))
      }))
    }
  }))
}))

describe('s3-to-local', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retrieves a file from s3 for a given key', async () => {
    jest.spyOn(fs, 'createWriteStream').mockReturnValueOnce({})
    stream.pipeline.mockImplementation(
      jest.fn((streams, callback) => {
        callback()
      })
    )

    const result = await s3ToLocal('/example/testS3Key.xml')
    const { createReadStream } = s3.getObject.mock.results[0].value

    expect(result).toBe(`${MOCK_TMP}/example/testS3Key.xml`)
    expect(createReadStream).toHaveBeenCalled()
    expect(stream.pipeline).toHaveBeenCalled()
    expect(s3.getObject).toHaveBeenCalledWith({
      Bucket: 'testbucket',
      Key: '/example/testS3Key.xml'
    })
  })
})
