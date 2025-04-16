'use strict'

import deleteMessages from '../delete-messages'
import { mockClient } from 'aws-sdk-client-mock'
import { SQS, DeleteMessageBatchCommand } from '@aws-sdk/client-sqs'
import { AWS } from '@defra-fish/connectors-lib'
const { mock: { results: [{ value: { sqs } }] } } = AWS

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    sqs: {
      send: jest.fn(() => ({}))
    }
  }))
}))

beforeEach(() => {
  sqs.send.mockClear()
})

describe('Delete messages successfully', () => {
  beforeEach(async () => {
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
  })

  it('deletes all messages with one call', () => {
    expect(sqs.send).toHaveBeenCalledTimes(1)
  })

  it('sends a DeleteMessagesBatchCommand', () => {
    expect(sqs.send).toHaveBeenCalledWith(expect.any(DeleteMessageBatchCommand))
  })

  it('sends queueUrl and all entries', () => {
    expect(sqs.send).toHaveBeenCalledWith(
      expect.objectContaining({
        input: {
          QueueUrl: 'http://0.0.0.0:0000/queue',
          Entries: [
            {
              Id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
              ReceiptHandle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1'
            },
            {
              Id: '58f6f3c9-97f8-405a-a3a7-5ac467277522',
              ReceiptHandle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b2'
            }
          ]
        }
      })
    )
  })

  expect(sqs.send).toHaveBeenCalledwith
})

test('Delete messages nothing to delete', async () => {
  await deleteMessages('http://0.0.0.0:0000/queue', [
    {
      id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
      handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
      status: 400
    }
  ])

  expect(sqs.send).not.toHaveBeenCalled()
})

test('Delete messages handles errors', async () => {
  sqs.send.mockRejectedValueOnce(new Error('Delete error'))

  await expect(
    deleteMessages('http://0.0.0.0:0000/queue', [
      {
        id: '58f6f3c9-97f8-405a-a3a7-5ac467277521',
        handle: '58f6f3c9-97f8-405a-a3a7-5ac467277521#03f003bc-7770-41c2-9217-aed966b578b1',
        status: 200
      }
    ])
  ).rejects.toThrow('Delete error')
})
