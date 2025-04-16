'use strict'

import readQueue from '../read-queue'
import { AWS } from '@defra-fish/connectors-lib'
const { sqs } = AWS.mock.results[0].value

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    sqs: {
      receiveMessage: jest.fn(() => ({ Messages: [] }))
    }
  }))
}))

const getSampleError = (httpStatusCode = undefined) => {
  const error = new Error('Queue error')
  if (httpStatusCode) {
    error.$metadata = { httpStatusCode }
  }
  return error
}

beforeEach(() => {
  sqs.receiveMessage.mockClear()
})

test('Nothing queued', async () => {
  const messages = await readQueue('http://0.0.0.0:0000/queue')
  expect(messages).toHaveLength(0)
})

test.each`
  queueUrl                         | visibilityTimeoutMs | waitTimeMs | expectedVTS | expectedWTS
  ${'http://0.0.0.0:0000/queue'}   | ${1000}             | ${2000}    | ${1}        | ${2}
  ${'http://1.2.3.4:5432/line'}    | ${3000}             | ${4000}    | ${3}        | ${4}
  ${'http://9.8.7.6:1234/joinThe'} | ${7000}             | ${20000}   | ${7}        | ${20}
`(
  'Specifies message configuration: queue url $queueUrl read with visibility timeout $expectedVTS seconds and a wait time of $expectedWTS seconds',
  async ({ queueUrl, visibilityTimeoutMs, waitTimeMs, expectedVTS, expectedWTS }) => {
    await readQueue(queueUrl, visibilityTimeoutMs, waitTimeMs)
    expect(sqs.receiveMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        QueueUrl: queueUrl,
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ['/*'],
        AttributeNames: ['MessageGroupId'],
        VisibilityTimeout: expectedVTS,
        WaitTimeSeconds: expectedWTS
      })
    )
  }
)

test('One message queued', async () => {
  sqs.receiveMessage.mockResolvedValueOnce({
    Messages: [
      {
        MessageId: '15eb8abc-c7c1-4167-9590-839c8feed6dd',
        ReceiptHandle: '15eb8abc-c7c1-4167-9590-839c8feed6dd#9be8971c-f9a9-4bb2-8515-98cdab660e1b',
        MD5OfBody: '640ad880b5be372fcb5c5ad8b5eb50af',
        Body: '{"id":"7f6e04fe-4cec-4f40-b763-8c66d71062d9"}',
        Attributes: {
          MessageGroupId: 'service-1'
        }
      }
    ]
  })
  const messages = await readQueue('http://0.0.0.0:0000/queue')
  expect(messages).toHaveLength(1)
  expect(messages[0]).toMatchObject({
    MessageId: '15eb8abc-c7c1-4167-9590-839c8feed6dd',
    ReceiptHandle: '15eb8abc-c7c1-4167-9590-839c8feed6dd#9be8971c-f9a9-4bb2-8515-98cdab660e1b',
    MD5OfBody: '640ad880b5be372fcb5c5ad8b5eb50af',
    Body: '{"id":"7f6e04fe-4cec-4f40-b763-8c66d71062d9"}',
    Attributes: {
      MessageGroupId: 'service-1'
    }
  })
})

test('Five messages queued', async () => {
  const messages = Array(5)
    .fill(null)
    .map((_, i) => ({
      MessageId: `msg-${i}`,
      ReceiptHandle: `handle-${i}`,
      MD5OfBody: 'hash',
      Body: '{}',
      Attributes: { MessageGroupId: 'service-1' }
    }))
  sqs.receiveMessage.mockResolvedValueOnce({ Messages: messages })
  const result = await readQueue('http://0.0.0.0:0000/queue')
  expect(result).toHaveLength(5)
})

test.each([
  ['when error contains http status code', 500],
  ["when error doesn't contain http status code", undefined]
])('Writes error to console %s', async (_d, httpStatusCode) => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  const e = getSampleError(httpStatusCode)
  sqs.receiveMessage.mockRejectedValueOnce(e)
  try {
    await readQueue('http://0.0.0.0:0000/queue')
  } catch {
    // swallow error (if it's thrown) as we're not interested in it
  }
  expect(consoleError).toHaveBeenCalled()
})

test('Handles queue errors gracefully', async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  sqs.receiveMessage.mockRejectedValueOnce(getSampleError(500))
  const result = await readQueue('http://0.0.0.0:0000/queue')
  expect(result).toEqual([])
})

test("If error doesn't contain an HTTP status code, it is re-thrown", async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  sqs.receiveMessage.mockRejectedValueOnce(getSampleError())
  await expect(readQueue('http://0.0.0.0:0000/queue')).rejects.toThrow('Queue error')
})
