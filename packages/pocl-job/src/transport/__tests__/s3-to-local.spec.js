import { s3ToLocal } from '../s3-to-local.js'
import { Readable } from 'stream'
import { AWS } from '@defra-fish/connectors-lib'
import fs from 'fs'

const MOCK_TMP = '/tmp/local/mock'

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
      send: jest.fn()
    },
    GetObjectCommand: jest.fn(params => ({ ...params }))
  }))
}))

jest.mock('util', () => {
  const actualUtil = jest.requireActual('util')
  return {
    ...actualUtil,
    promisify: jest.fn(() => {
      return jest.fn(() => Promise.resolve())
    })
  }
})

describe('s3-to-local', () => {
  const { s3 } = AWS.mock.results[0].value

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('retrieves a file from s3 for a given key', async () => {
    const mockStream = new Readable({
      read () {
        this.push('test data')
        this.push(null)
      }
    })

    s3.send.mockResolvedValue({ Body: mockStream })

    jest.spyOn(fs, 'createWriteStream').mockReturnValue({})

    const s3Key = '/example/testS3Key.xml'
    const result = await s3ToLocal(s3Key)

    expect(result).toBe(`${MOCK_TMP}/example/testS3Key.xml`)
    expect(fs.createWriteStream).toHaveBeenCalledWith(`${MOCK_TMP}/example/testS3Key.xml`)
    expect(s3.send).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: 'testbucket',
        Key: s3Key
      })
    )
  })
})
