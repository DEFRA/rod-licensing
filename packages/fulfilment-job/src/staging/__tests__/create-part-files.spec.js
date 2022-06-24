import moment from 'moment'
import { createPartFiles } from '../create-part-files.js'
import { writeS3PartFile } from '../../transport/s3.js'
import config from '../../config.js'
import { FulfilmentRequestFile, FulfilmentRequest, executePagedQuery, executeQuery, persist } from '@defra-fish/dynamics-lib'
import {
  MOCK_12MONTH_SENIOR_PERMIT,
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY
} from '../../../../sales-api-service/src/__mocks__/test-data.js'
import { FULFILMENT_FILE_STATUS_OPTIONSET, getOptionSetEntry } from '../staging-common.js'
import db from 'debug'
const EXECUTION_DATE = moment()

jest.mock('../../config.js', () => ({
  file: {
    size: 1,
    partFileSize: 1
  }
}))

jest.mock('../../transport/s3.js')
jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  executeQuery: jest.fn(async () => []),
  executePagedQuery: jest.fn(),
  persist: jest.fn()
}))
jest.mock('debug', () => jest.fn(() => jest.fn()))
const debugMock = db.mock.results[0].value

const getMockFulfilmentRequest = () => {
  return Object.assign(new FulfilmentRequest(), {
    referenceNumber: `test${MOCK_EXISTING_PERMISSION_ENTITY.referenceNumber.substring(
      MOCK_EXISTING_PERMISSION_ENTITY.referenceNumber.lastIndexOf('-')
    )}`,
    requestTimestamp: EXECUTION_DATE.toISOString(),
    notes: 'Initial fulfilment request created at point of sale',
    status: { id: 910400000, label: 'Pending', description: 'Pending' }
  })
}

const getMockFulfilmentRequestQueryResult = () => ({
  entity: Object.assign(new FulfilmentRequest(), getMockFulfilmentRequest()),
  expanded: {
    permission: {
      entity: MOCK_EXISTING_PERMISSION_ENTITY,
      expanded: {
        licensee: {
          entity: MOCK_EXISTING_CONTACT_ENTITY
        },
        permit: {
          entity: MOCK_12MONTH_SENIOR_PERMIT
        }
      }
    }
  }
})

describe('createPartFiles', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    executePagedQuery.mockReset()
    executeQuery.mockReset()
    executeQuery.mockImplementation(async () => [])
    config.file.size = 1
    config.file.partFileSize = 1
  })

  const getFulfilmentFileExpectations = config =>
    expect.objectContaining({
      fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`,
      date: expect.anything(),
      notes: expect.stringMatching(/^The fulfilment file finished exporting at .+/),
      numberOfRequests: 1,
      status: expect.objectContaining({ id: 910400004, label: 'Exported', description: 'Exported' }),
      ...config
    })

  const getFulfilmentRequestExpectations = () =>
    expect.objectContaining(
      Object.assign(getMockFulfilmentRequest().toJSON(), {
        status: expect.objectContaining({ id: 910400001, label: 'Sent', description: 'Sent' })
      })
    )

  const getS3DataExpectations = () =>
    expect.arrayContaining([
      {
        fulfilmentRequest: getFulfilmentRequestExpectations(),
        licensee: MOCK_EXISTING_CONTACT_ENTITY,
        permission: MOCK_EXISTING_PERMISSION_ENTITY,
        permit: MOCK_12MONTH_SENIOR_PERMIT
      }
    ])

  describe('queries dynamics for data and writes a part file', () => {
    beforeEach(() => {
      executePagedQuery.mockImplementation(
        jest.fn(async (query, onPageReceived) => onPageReceived([getMockFulfilmentRequestQueryResult()]))
      )
    })

    it('createPartFiles has no return value', async () => {
      await expect(createPartFiles()).resolves.toBeUndefined()
    })

    it('writes a part file', async () => {
      await createPartFiles()
      expect(writeS3PartFile).toHaveBeenCalledWith(getFulfilmentFileExpectations(), 0, getS3DataExpectations())
    })

    it('persist is only called once', async () => {
      await createPartFiles()
      expect(persist).toHaveBeenCalledTimes(1)
    })

    it('persist is called according to expectations', async () => {
      await createPartFiles()
      expect(persist).toHaveBeenCalledWith([getFulfilmentFileExpectations(), getFulfilmentRequestExpectations()])
    })
  })

  it('part file number', async () => {
    let fulfilmentFile
    config.file.size = 5000
    config.file.partFileSize = 999
    const page = []
    for (let x = 0; x < 1840; x++) {
      page.push(getMockFulfilmentRequestQueryResult())
    }
    executePagedQuery.mockImplementation(jest.fn(async (_query, onPageReceived) => onPageReceived(page)))
    executeQuery.mockImplementation(() => (fulfilmentFile ? [{ entity: fulfilmentFile }] : []))
    persist.mockImplementation(data => {
      const [potentialFulfilmentFile] = data
      if (potentialFulfilmentFile.constructor.name === 'FulfilmentRequestFile') {
        fulfilmentFile = potentialFulfilmentFile
      }
    })
    await createPartFiles()
    expect(writeS3PartFile).toHaveBeenCalledWith(expect.any(Object), 0, expect.any(Object))
    expect(writeS3PartFile).toHaveBeenCalledWith(expect.any(Object), 1, expect.any(Object))
  })

  describe('calculates the next file in the sequence correctly', () => {
    beforeEach(() => {
      executePagedQuery.mockImplementation(
        jest.fn(async (query, onPageReceived) => onPageReceived([getMockFulfilmentRequestQueryResult()]))
      )
      executeQuery.mockImplementation(
        jest.fn(async () => [
          { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0003.json`, status: { label: 'Delivered' } } },
          { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0002.json`, status: { label: 'Delivered' } } },
          { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}1009.json`, status: { label: 'Delivered' } } },
          { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`, status: { label: 'Delivered' } } },
          { entity: { fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0006.json`, status: { label: 'Delivered' } } }
        ])
      )
    })

    it('writes to s3 correctly', async () => {
      await createPartFiles()
      expect(writeS3PartFile).toHaveBeenCalledWith(
        getFulfilmentFileExpectations({
          fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}1010.json`
        }),
        0,
        getS3DataExpectations()
      )
    })

    it('calls persist once', async () => {
      await createPartFiles()
      expect(persist).toHaveBeenCalledTimes(1)
    })

    it('calls persist with expected arguments', async () => {
      await createPartFiles()
      expect(persist).toHaveBeenCalledWith([
        getFulfilmentFileExpectations({
          fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}1010.json`
        }),
        getFulfilmentRequestExpectations()
      ])
    })
  })

  describe('will write multiple part files as necessary', () => {
    beforeEach(() => {
      config.file.size = 2
      executePagedQuery.mockImplementation(
        jest.fn(async (query, onPageReceived) => {
          // Simulate multiple pages of data
          await onPageReceived([getMockFulfilmentRequestQueryResult()])
          await onPageReceived([getMockFulfilmentRequestQueryResult()])
        })
      )
      executeQuery.mockImplementationOnce(jest.fn(async () => []))
      executeQuery.mockImplementationOnce(jest.fn(async () => [await createMockFulfilmentFileQueryResult(1, 'Pending', 1)]))
      executeQuery.mockImplementationOnce(jest.fn(async () => [await createMockFulfilmentFileQueryResult(1, 'Pending', 2)]))
    })

    it('first call to writeS3PartFile writes a pending record to s3', async () => {
      await createPartFiles()
      expect(writeS3PartFile).toHaveBeenNthCalledWith(
        1,
        getFulfilmentFileExpectations({
          notes: expect.stringMatching(/^The fulfilment file is currently being populated prior to exporting.$/),
          status: expect.objectContaining({ id: 910400000, label: 'Pending', description: 'Pending' })
        }),
        0,
        getS3DataExpectations()
      )
    })

    it('second call to writeS3PartFile writes finished record to s3', async () => {
      await createPartFiles()
      expect(writeS3PartFile).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}0001.json`,
          date: expect.anything(),
          notes: expect.stringMatching(/^The fulfilment file finished exporting at .+/),
          numberOfRequests: 2,
          status: expect.objectContaining({ id: 910400004, label: 'Exported', description: 'Exported' })
        }),
        1,
        getS3DataExpectations()
      )
    })

    it('writes pending part file record to Dynamics at start of export', async () => {
      await createPartFiles()
      expect(persist).toHaveBeenNthCalledWith(1, [
        getFulfilmentFileExpectations({
          notes: expect.stringMatching(/^The fulfilment file is currently being populated prior to exporting.$/),
          status: expect.objectContaining({ id: 910400000, label: 'Pending', description: 'Pending' })
        }),
        getFulfilmentRequestExpectations()
      ])
    })

    it('writes finished part file record to Dynamics once export is finished', async () => {
      await createPartFiles()
      expect(persist).toHaveBeenNthCalledWith(2, [
        getFulfilmentFileExpectations({
          numberOfRequests: 2
        }),
        getFulfilmentRequestExpectations()
      ])
    })

    it('updates Dynamics with fulfilment file details once export is finished', async () => {
      await createPartFiles()
      expect(persist).toHaveBeenNthCalledWith(3, [
        getFulfilmentFileExpectations({
          numberOfRequests: 2
        })
      ])
    })
  })

  /**
   * Following tests are for the case where a call to Dynamics fails with a socket error, and the
   * last part file wasn't full (i.e. number of fulfilment requests was less than the max for
   * a part file). This was causing an existing part file to be overwritten, but the fulfilment
   * requests would appear to have been sent...
   */
  describe.each([
    [914, 2, 1], // taken from the failure on 21/5/2022
    [1001, 20, 2],
    [2002, 34, 3],
    [3003, 995, 4],
    [4004, 995, 5],
    [4996, 4, 6]
  ])(
    'When last run terminated with a socket error and part file was not full',
    (numberOfPreviousRequests, newRequestsToCreate, expectedCallIndex) => {
      beforeEach(() => {
        config.file.size = 5000
        config.file.partFileSize = 999
        executeQuery.mockImplementation(async () => [await createMockFulfilmentFileQueryResult(1, 'Pending', numberOfPreviousRequests)])
        executePagedQuery.mockImplementation((_query, onPageReceived) =>
          onPageReceived(Array(newRequestsToCreate).fill(getMockFulfilmentRequestQueryResult()))
        )
      })

      it('calculates part file number correctly', async () => {
        await createPartFiles()

        expect(writeS3PartFile).toHaveBeenCalledWith(expect.any(Object), expectedCallIndex, expect.any(Array))
      })

      it('writes a debug log', async () => {
        await createPartFiles()

        expect(debugMock).toHaveBeenCalledWith(
          `Found existing unfilled part file part${expectedCallIndex - 1}, incrementing next part file number to part${expectedCallIndex}`
        )
      })
    }
  )
})

const createMockFulfilmentFileQueryResult = async (sequenceNo, statusLabel, numberOfRequests = 0) => ({
  entity: Object.assign(new FulfilmentRequestFile(), {
    fileName: `EAFF${EXECUTION_DATE.format('YYYYMMDD')}${String(sequenceNo).padStart(4, '0')}.json`,
    date: EXECUTION_DATE.toISOString(),
    notes: 'The fulfilment file is currently being populated prior to exporting.',
    numberOfRequests: numberOfRequests,
    status: await getOptionSetEntry(FULFILMENT_FILE_STATUS_OPTIONSET, statusLabel)
  })
})
