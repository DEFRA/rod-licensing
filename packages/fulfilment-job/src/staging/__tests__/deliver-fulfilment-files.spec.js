import { Readable, PassThrough, Writable } from 'stream'
import { deliverFulfilmentFiles } from '../deliver-fulfilment-files.js'
import { createS3WriteStream, readS3PartFiles } from '../../transport/s3.js'
import { FULFILMENT_FILE_STATUS_OPTIONSET, getOptionSetEntry } from '../staging-common.js'
import { FulfilmentRequestFile, executeQuery, persist } from '@defra-fish/dynamics-lib'
import openpgp from 'openpgp'
import config from '../../config.js'
import streamHelper from '../streamHelper.js'
import merge2 from 'merge2'

jest.mock('../../transport/s3.js')
jest.mock('openpgp', () => ({
  readKey: jest.fn(() => ({})),
  encrypt: jest.fn(({ message: readableStream }) => readableStream),
  Message: {
    fromText: jest.fn(s => s)
  }
}))
jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(),
  persist: jest.fn()
}))
jest.mock('../../config.js', () => ({
  pgp: {
    publicKey: '--- START ENCRYPTION KEY ---\nsecr3tSqu1rr3l\n--- END ENCRYPTION KEY ---',
    sendUnencryptedFile: true
  }
}))
jest.spyOn(streamHelper, 'pipelinePromise')
jest.mock('merge2', () => jest.fn((...args) => jest.requireActual('merge2')(...args)))
// Part file data for all files
readS3PartFiles.mockImplementation(async () => [Readable.from(['{"part": 0}']), Readable.from(['{"part": 1}'])])

describe('deliverFulfilmentFiles', () => {
  beforeEach(jest.clearAllMocks)

  it('delivers all fulfilment files marked with the Exported status to the fulfilment provider', async () => {
    const fileShaHash = 'f89f5dd268a8b02758e08d3b806d0695da94b84978954e281ccaba7eb838791a'
    const mockFulfilmentRequestFile1 = await createMockFulfilmentRequestFile('EAFF202006180001.json', '2020-06-18T11:47:32.982Z')
    const mockFulfilmentRequestFile2 = await createMockFulfilmentRequestFile('EAFF202006180002.json', '2020-06-18T11:47:33.982Z')

    // Reverse order to ensure files are sent in ascending order according to their sequence number
    executeQuery.mockResolvedValue([{ entity: mockFulfilmentRequestFile2 }, { entity: mockFulfilmentRequestFile1 }])

    // Streams for file1
    const { s3DataStreamFile: s3DataStreamFile1, s3HashStreamFile: s3HashStreamFile1 } = createMockFileStreams()

    // Streams for file2
    const { s3DataStreamFile: s3DataStreamFile2, s3HashStreamFile: s3HashStreamFile2 } = createMockFileStreams()

    // Run the delivery
    await expect(deliverFulfilmentFiles()).resolves.toBeUndefined()

    expect(readS3PartFiles).toHaveBeenCalledWith(mockFulfilmentRequestFile1)

    // File 1 expectations
    expect(createS3WriteStream).toHaveBeenNthCalledWith(1, 'EAFF202006180001.json')
    expect(createS3WriteStream).toHaveBeenNthCalledWith(3, 'EAFF202006180001.json.sha256')
    expect(JSON.parse(s3DataStreamFile1.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(s3HashStreamFile1.dataProcessed).toEqual(fileShaHash) // validated

    // File 2 expectations
    expect(createS3WriteStream).toHaveBeenNthCalledWith(4, 'EAFF202006180002.json')
    expect(createS3WriteStream).toHaveBeenNthCalledWith(6, 'EAFF202006180002.json.sha256')
    expect(JSON.parse(s3DataStreamFile2.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(s3HashStreamFile2.dataProcessed).toEqual(fileShaHash) // validated

    // Persist to dynamics for file 1
    expect(persist).toHaveBeenNthCalledWith(1, [
      expect.objectContaining({
        fileName: 'EAFF202006180001.json',
        date: '2020-06-18T11:47:32.982Z',
        deliveryTimestamp: expect.any(String),
        notes: expect.stringMatching(/The fulfilment file was successfully delivered at .+/),
        numberOfRequests: 2,
        status: expect.objectContaining({
          description: 'Delivered',
          id: 910400001,
          label: 'Delivered'
        })
      })
    ])
    // Persist to dynamics for file 2
    expect(persist).toHaveBeenNthCalledWith(2, [
      expect.objectContaining({
        fileName: 'EAFF202006180002.json',
        date: '2020-06-18T11:47:33.982Z',
        deliveryTimestamp: expect.any(String),
        notes: expect.stringMatching(/The fulfilment file was successfully delivered at .+/),
        numberOfRequests: 2,
        status: expect.objectContaining({
          description: 'Delivered',
          id: 910400001,
          label: 'Delivered'
        })
      })
    ])
  })

  it('delivers a fulfilment file with the .enc extension', async () => {
    const filename = 'EAFF202104190001.json'
    await mockExecuteQuery(filename)
    createMockFileStreams()

    await deliverFulfilmentFiles()

    expect(createS3WriteStream).toHaveBeenCalledWith(`${filename}.enc`)
  })

  it('encrypts the enc file', async () => {
    const encryptStream = Readable.from('secret-squirrel')
    await mockExecuteQuery()
    openpgp.encrypt.mockResolvedValueOnce(encryptStream)
    createMockFileStreams()

    await deliverFulfilmentFiles()

    expect(streamHelper.pipelinePromise).toHaveBeenCalledWith(
      expect.arrayContaining([encryptStream, expect.any(Writable), expect.any(Writable)])
    )
  })

  it('Passes message object created from fulfilment readable stream', async () => {
    const s = createTestableStream()
    streamHelper.pipelinePromise.mockResolvedValue()
    merge2.mockResolvedValue(s)
    await mockExecuteQuery()
    createMockFileStreams()
    await deliverFulfilmentFiles()
    expect(openpgp.Message.fromText).toHaveBeenCalledWith(s)
  })

  it('Uses message reading to encrypt', async () => {
    const s = createTestableStream()
    streamHelper.pipelinePromise.mockResolvedValue()
    openpgp.Message.fromText.mockResolvedValue(s)
    await mockExecuteQuery()
    createMockFileStreams()
    await deliverFulfilmentFiles()
    expect(openpgp.encrypt).toHaveBeenCalledWith(
      expect.objectContaining({
        message: s
      })
    )
  })

  it('encrypts using public key', async () => {
    const publicKeys = { type: 'skeleton' }
    openpgp.readKey.mockResolvedValue(publicKeys)
    await mockExecuteQuery()
    createMockFileStreams()
    await deliverFulfilmentFiles()
    expect(openpgp.encrypt).toHaveBeenCalledWith(
      expect.objectContaining({
        publicKeys
      })
    )
  })

  it.each(['secret-squirrel', 'obfuscated-orangutang', 'hidden-horse'])("reads key '%s' from config", async key => {
    config.pgp.publicKey = key
    await mockExecuteQuery()
    createMockFileStreams()
    await deliverFulfilmentFiles()
    expect(openpgp.readKey).toHaveBeenCalledWith(
      expect.objectContaining({
        armoredKey: key
      })
    )
  })

  it("doesn't send unencrypted file if sendUnencryptedFile is false", async () => {
    config.pgp.sendUnencryptedFile = false
    const s1 = createTestableStream()
    const s2 = createTestableStream()
    const s3 = createTestableStream()
    streamHelper.pipelinePromise.mockResolvedValue()
    openpgp.encrypt.mockResolvedValue(s2)
    merge2.mockReturnValueOnce(s1).mockReturnValueOnce(s2).mockReturnValueOnce(s3)
    await mockExecuteQuery()
    createMockFileStreams()

    await deliverFulfilmentFiles()

    expect(streamHelper.pipelinePromise).not.toHaveBeenCalledWith(expect.arrayContaining([s1]))
  })
})

const mockExecuteQuery = async (filename = 'EAFF202104190001.json') => {
  const mockFulfilmentRequestFile = await createMockFulfilmentRequestFile(filename, '2021-04-19T11:47:32.982Z')
  executeQuery.mockResolvedValue([{ entity: mockFulfilmentRequestFile }])
  return mockFulfilmentRequestFile
}

const createMockFulfilmentRequestFile = async (fileName, date) =>
  Object.assign(new FulfilmentRequestFile(), {
    fileName,
    date,
    notes: `The fulfilment file finished exporting at ${date}`,
    numberOfRequests: 2,
    status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported')
  })

const createMockFileStreams = () => {
  const s3DataStreamFile = createTestableStream()
  createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3DataStreamFile, managedUpload: Promise.resolve() })

  const s3EncryptedDataStreamFile = createTestableStream()
  createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3EncryptedDataStreamFile, managedUpload: Promise.resolve() })

  const s3HashStreamFile = createTestableStream()
  createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3HashStreamFile, managedUpload: Promise.resolve() })

  return {
    s3DataStreamFile,
    s3EncryptedDataStreamFile,
    s3HashStreamFile
  }
}

const createTestableStream = (tag = '') => {
  const testableStream = new PassThrough()
  testableStream.dataProcessed = ''
  testableStream.tag = tag
  testableStream.on('data', data => {
    testableStream.dataProcessed += data
  })
  return testableStream
}
