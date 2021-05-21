import { Readable, PassThrough, Writable } from 'stream'
import { deliverFulfilmentFiles } from '../deliver-fulfilment-files.js'
import { createS3WriteStream, readS3PartFiles } from '../../transport/s3.js'
import { createFtpWriteStream } from '../../transport/ftp.js'
import { FULFILMENT_FILE_STATUS_OPTIONSET, getOptionSetEntry } from '../staging-common.js'
import { FulfilmentRequestFile, executeQuery, persist } from '@defra-fish/dynamics-lib'
import util from 'util'
import openpgp, { stream } from 'openpgp'
import config from '../../config.js'
import streamHelper from '../streamHelper.js'

jest.mock('../../config.js')
jest.mock('../../transport/s3.js')
jest.mock('../../transport/ftp.js')
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
    publicKey: '--- START ENCRYPTION KEY ---\nsecr3tSqu1rr3l\n--- END ENCRYPTION KEY ---'
  }
}))
jest.spyOn(streamHelper, 'pipelinePromise')

describe('deliverFulfilmentFiles', () => {
  beforeEach(jest.clearAllMocks)

  it('delivers all fulfilment files marked with the Exported status to the fulfilment provider', async () => {
    const fileShaHash = 'f89f5dd268a8b02758e08d3b806d0695da94b84978954e281ccaba7eb838791a'
    const mockFulfilmentRequestFile1 = await createMockFulfilmentRequestFile('EAFF202006180001.json', '2020-06-18T11:47:32.982Z')
    const mockFulfilmentRequestFile2 = await createMockFulfilmentRequestFile('EAFF202006180002.json', '2020-06-18T11:47:33.982Z')

    // Reverse order to ensure files are sent in ascending order according to their sequence number
    executeQuery.mockResolvedValue([{ entity: mockFulfilmentRequestFile2 }, { entity: mockFulfilmentRequestFile1 }])

    // Part file data for all files
    readS3PartFiles.mockImplementation(jest.fn(async () => [Readable.from(['{"part": 0}']), Readable.from(['{"part": 1}'])]))

    // Streams for file1
    const {
      s3DataStreamFile: s3DataStreamFile1,
      ftpDataStreamFile: ftpDataStreamFile1,
      s3HashStreamFile: s3HashStreamFile1,
      ftpHashStreamFile: ftpHashStreamFile1
    } = createMockFileStreams()

    // Streams for file2
    const {
      s3DataStreamFile: s3DataStreamFile2,
      ftpDataStreamFile: ftpDataStreamFile2,
      s3HashStreamFile: s3HashStreamFile2,
      ftpHashStreamFile: ftpHashStreamFile2
    } = createMockFileStreams()

    // Run the delivery
    await expect(deliverFulfilmentFiles()).resolves.toBeUndefined()

    expect(readS3PartFiles).toHaveBeenCalledWith(mockFulfilmentRequestFile1)

    // File 1 expectations
    expect(createS3WriteStream).toHaveBeenNthCalledWith(1, 'EAFF202006180001.json')
    expect(createS3WriteStream).toHaveBeenNthCalledWith(3, 'EAFF202006180001.json.sha256')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(1, 'EAFF202006180001.json')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(3, 'EAFF202006180001.json.sha256')
    expect(JSON.parse(s3DataStreamFile1.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(JSON.parse(ftpDataStreamFile1.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(s3HashStreamFile1.dataProcessed).toEqual(fileShaHash) // validated
    expect(ftpHashStreamFile1.dataProcessed).toEqual(fileShaHash) // validated

    // // File 2 expectations
    expect(createS3WriteStream).toHaveBeenNthCalledWith(4, 'EAFF202006180002.json')
    expect(createS3WriteStream).toHaveBeenNthCalledWith(6, 'EAFF202006180002.json.sha256')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(4, 'EAFF202006180002.json')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(6, 'EAFF202006180002.json.sha256')
    expect(JSON.parse(s3DataStreamFile2.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(JSON.parse(ftpDataStreamFile2.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(s3HashStreamFile2.dataProcessed).toEqual(fileShaHash) // validated
    expect(ftpHashStreamFile2.dataProcessed).toEqual(fileShaHash) // validated

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
    const mockFulfilmentRequestFile = await createMockFulfilmentRequestFile(filename, '2021-04-19T11:47:32.982Z')
    executeQuery.mockResolvedValue([{ entity: mockFulfilmentRequestFile }])
    readS3PartFiles.mockImplementation(jest.fn(async () => [Readable.from(['{"part": 0}']), Readable.from(['{"part": 1}'])]))
    createMockFileStreams()

    await deliverFulfilmentFiles()

    expect(createS3WriteStream).toHaveBeenCalledWith(`${filename}.enc`)
  })

  it('encrypts the enc file', async () => {
    const encryptStream = Readable.from('secret-squirrel')
    const filename = 'EAFF202104190001.json'
    const mockFulfilmentRequestFile = await createMockFulfilmentRequestFile(filename, '2021-04-19T11:47:32.982Z')
    executeQuery.mockResolvedValue([{ entity: mockFulfilmentRequestFile }])
    readS3PartFiles.mockImplementation(jest.fn(async () => [Readable.from(['{"part": 0}']), Readable.from(['{"part": 1}'])]))
    openpgp.encrypt.mockResolvedValueOnce(encryptStream)
    createMockFileStreams()

    await deliverFulfilmentFiles()

    expect(streamHelper.pipelinePromise).toHaveBeenCalledWith(
      expect.arrayContaining([
        encryptStream,
        expect.any(Writable),
        expect.any(Writable)
      ])
    )
  })
})

const createMockFulfilmentRequestFile = async (fileName, date) => Object.assign(new FulfilmentRequestFile(), {
  fileName,
  date,
  notes: `The fulfilment file finished exporting at ${date}`,
  numberOfRequests: 2,
  status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported')
})

const createMockFileStreams = () => {
  const s3DataStreamFile = createTestableStream()
  const ftpDataStreamFile = createTestableStream()
  createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3DataStreamFile, managedUpload: Promise.resolve() })
  createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpDataStreamFile, managedUpload: Promise.resolve() })

  const s3EncryptedDataStreamFile = createTestableStream()
  const ftpEncryptedDataStreamFile = createTestableStream()
  createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3EncryptedDataStreamFile, managedUpload: Promise.resolve() })
  createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpEncryptedDataStreamFile, managedUpload: Promise.resolve() })

  const s3HashStreamFile = createTestableStream()
  const ftpHashStreamFile = createTestableStream()
  createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3HashStreamFile, managedUpload: Promise.resolve() })
  createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpHashStreamFile, managedUpload: Promise.resolve() })

  return {
    s3DataStreamFile,
    ftpDataStreamFile,
    s3EncryptedDataStreamFile,
    ftpEncryptedDataStreamFile,
    s3HashStreamFile,
    ftpHashStreamFile
  }
}

const createTestableStream = () => {
  const testableStream = new PassThrough()
  testableStream.dataProcessed = ''
  testableStream.on('data', data => {
    testableStream.dataProcessed += data
  })
  return testableStream
}
