import { s3ToLocal } from '../s3-to-local.js'
import stream from 'stream'
import { AWS } from '@defra-fish/connectors-lib'
import fs from 'fs'
const { GetObjectCommand } = AWS.mock.results[0].value

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

jest.mock('@defra-fish/connectors-lib', () => {
  const { Readable } = require('stream')

  const mockS3Stream = new Readable({
    read () {
      this.push(null)
    }
  })

  const mockSend = jest.fn().mockResolvedValue({
    Body: mockS3Stream
  })

  const mockGetObjectCommand = jest.fn(function (input) {
    this.input = input
  })

  return {
    AWS: jest.fn(() => ({
      s3: {
        send: mockSend
      },
      GetObjectCommand: mockGetObjectCommand
    }))
  }
})

describe('s3ToLocal', () => {
  beforeEach(() => {
    jest.spyOn(fs, 'createWriteStream').mockReturnValue({})
    stream.pipeline.mockImplementation(
      jest.fn((...args) => {
        const callback = args[args.length - 1]
        callback()
      })
    )
  })

  it('returns the expected local file path', async () => {
    const result = await s3ToLocal('/example/testS3Key.xml')
    expect(result).toBe(`${MOCK_TMP}/example/testS3Key.xml`)
  })

  it('calls stream.pipeline', async () => {
    await s3ToLocal('/example/testS3Key.xml')
    expect(stream.pipeline).toHaveBeenCalled()
  })

  it('calls s3.send with an instance of GetObjectCommand', async () => {
    await s3ToLocal('/example/testS3Key.xml')
    const sendCallArg = AWS().s3.send.mock.calls[0][0]
    expect(sendCallArg).toBeInstanceOf(GetObjectCommand)
  })

  it('calls GetObjectCommand with the correct input', async () => {
    await s3ToLocal('/example/testS3Key.xml')
    const sendCallArg = AWS().s3.send.mock.calls[0][0]
    expect(sendCallArg.input).toEqual({
      Bucket: 'testbucket',
      Key: '/example/testS3Key.xml'
    })
  })
})
