import { Readable, PassThrough } from 'stream'
import { deliverFulfilmentFiles } from '../deliver-fulfilment-files.js'
import { createS3WriteStream, readS3PartFiles } from '../../transport/s3.js'
import { createFtpWriteStream } from '../../transport/ftp.js'
import { FULFILMENT_FILE_STATUS_OPTIONSET, getOptionSetEntry } from '../staging-common.js'
import { FulfilmentRequestFile, executeQuery, persist } from '@defra-fish/dynamics-lib'

jest.mock('../../config.js')
jest.mock('../../transport/s3.js')
jest.mock('../../transport/ftp.js')
jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(),
  persist: jest.fn()
}))

describe('deliverFulfilmentFiles', () => {
  beforeEach(jest.clearAllMocks)

  it('delivers all fulfilment files marked with the Exported status to the fulfilment provider', async () => {
    const mockFulfilmentRequestFile = Object.assign(new FulfilmentRequestFile(), {
      fileName: 'EAFF202006180001.json',
      date: '2020-06-18T11:47:32.982Z',
      notes: 'The fulfilment file finished exporting at 2020-06-18T11:47:32.982Z',
      numberOfRequests: 2,
      status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, 'Exported')
    })
    executeQuery.mockResolvedValue([{ entity: mockFulfilmentRequestFile }])
    readS3PartFiles.mockImplementation(jest.fn(async () => [Readable.from(['{"part": 0}']), Readable.from(['{"part": 1}'])]))
    const s3DataStream = createTestableStream()
    const ftpDataStream = createTestableStream()
    createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3DataStream, managedUpload: Promise.resolve() })
    createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpDataStream, managedUpload: Promise.resolve() })
    const s3HashStream = createTestableStream()
    const ftpHashStream = createTestableStream()
    createS3WriteStream.mockReturnValueOnce({ s3WriteStream: s3HashStream, managedUpload: Promise.resolve() })
    createFtpWriteStream.mockReturnValueOnce({ ftpWriteStream: ftpHashStream, managedUpload: Promise.resolve() })

    await expect(deliverFulfilmentFiles()).resolves.toBeUndefined()

    expect(readS3PartFiles).toHaveBeenCalledWith(mockFulfilmentRequestFile)
    expect(createS3WriteStream).toHaveBeenNthCalledWith(1, 'EAFF202006180001.json')
    expect(createS3WriteStream).toHaveBeenNthCalledWith(2, 'EAFF202006180001.json.sha256')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(1, 'EAFF202006180001.json')
    expect(createFtpWriteStream).toHaveBeenNthCalledWith(2, 'EAFF202006180001.json.sha256')
    expect(JSON.parse(s3DataStream.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(JSON.parse(ftpDataStream.dataProcessed)).toEqual({ licences: [{ part: 0 }, { part: 1 }] })
    expect(s3HashStream.dataProcessed).toEqual('f89f5dd268a8b02758e08d3b806d0695da94b84978954e281ccaba7eb838791a') // validated
    expect(ftpHashStream.dataProcessed).toEqual('f89f5dd268a8b02758e08d3b806d0695da94b84978954e281ccaba7eb838791a') // validated
    expect(persist).toHaveBeenCalledWith(
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
    )
  })
})

const createTestableStream = () => {
  const stream = new PassThrough()
  stream.dataProcessed = ''
  stream.on('data', data => {
    stream.dataProcessed += data
  })
  return stream
}
