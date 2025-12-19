'use strict'

import deleteMessages from '../delete-messages'
import { AWS } from '@defra-fish/connectors-lib'
const { sqs } = AWS.mock.results[0].value

const getSampleDeleteMessageBatchResponse = (successfulIds, failedIds = []) => ({
  ResponseMetadata: {
    RequestId: '00000000-0000-0000-0000-000000000000'
  },
  ...(successfulIds.length ? { Successful: successfulIds.map(Id => ({ Id })) } : {}),
  ...(failedIds.length ? { Failed: failedIds.map(Id => ({ Id })) } : {})
})

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    sqs: {
      deleteMessageBatch: jest.fn(() => {})
    }
  }))
}))

beforeEach(() => {
  sqs.deleteMessageBatch.mockClear()
})

test('Delete messages successfully', async () => {
  sqs.deleteMessageBatch.mockResolvedValueOnce(
    getSampleDeleteMessageBatchResponse(['58f6f3c9-97f8-405a-a3a7-5ac467277521', '58f6f3c9-97f8-405a-a3a7-5ac467277522'])
  )
  const results = await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277522',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b2',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277523',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b3',
      status: 4200
    }
  ])

  expect(results).toBeUndefined()
})

test("Delete messages successfully doesn't generate an error", async () => {
  const consoleErrorSpy = jest.spyOn(console, 'error')
  sqs.deleteMessageBatch.mockResolvedValueOnce(
    getSampleDeleteMessageBatchResponse(['58f6f3c9-97f8-405a-a3a7-5ac467277521', '58f6f3c9-97f8-405a-a3a7-5ac467277522'])
  )
  await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277522',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b2',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277523',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b3',
      status: 4200
    }
  ])

  expect(consoleErrorSpy).not.toHaveBeenCalled()
})

test('Delete messages nothing to delete', async () => {
  sqs.deleteMessageBatch.mockResolvedValueOnce(getSampleDeleteMessageBatchResponse([]))
  const results = await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 400
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277522',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b2',
      status: 400
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277523',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b3',
      status: 400
    }
  ])

  expect(results).toBeUndefined()
  sqs.deleteMessageBatch.mockReset()
})

test('Delete messages with failures', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  sqs.deleteMessageBatch.mockResolvedValueOnce(
    getSampleDeleteMessageBatchResponse([], ['58f6f3c9-97f8-405a-a3a7-5ac467277521', '58f6f3c9-97f8-405a-a3a7-5ac467277522'])
  )
  const results = await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277522',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b2',
      status: 200
    },
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277523',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b3',
      status: 4200
    }
  ])

  expect(results).toBeUndefined()
  expect(consoleError).toHaveBeenCalled()
})

test('Delete message does not throw exception', async () => {
  const exception = new Error('Not Found')
  exception.code = 404
  sqs.deleteMessageBatch.mockRejectedValueOnce(exception)

  const result = await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 200
    }
  ])
  expect(result).toBeUndefined()
})

test('Delete message batch logs exception with console.error', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  const exception = new Error('Not Found')
  exception.code = 404
  const url = 'http://0.0.0.0:0000/queue'
  sqs.deleteMessageBatch.mockRejectedValueOnce(exception)

  await deleteMessages(url, [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 200
    }
  ])
  expect(consoleError).toHaveBeenCalledWith('Error deleting messages for %s: %o', url, exception)
})
