'use strict'

import readQueue from '../read-queue'
import AWS from 'aws-sdk'

test('Nothing queued', async () => {
  AWS.__mockEmptyQueue()
  const messages = await readQueue('http://0.0.0.0:0000/queue')
  expect(messages).toBeUndefined()
})

test('One message queued', async () => {
  AWS.__mockOneMessage()
  const messages = await readQueue('http://0.0.0.0:0000/queue')
  expect(messages.length).toBe(1)
  expect(messages).toContainEqual({
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
  AWS.__mockNMessages(5)
  const messages = await readQueue('http://0.0.0.0:0000/queue')
  expect(messages.length).toBe(5)
})

test('Throws exception on no queue available', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  AWS.__mockFailNoQueue()
  async function check () {
    try {
      return readQueue('http://0.0.0.0:0000/queue')
    } catch (error) {
      throw new Error()
    }
  }
  await expect(check()).rejects.toThrow(Error)
  expect(consoleError).toHaveBeenCalled()
})

test('Completes on general processing error', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  AWS.__mockAWSError()
  const result = await readQueue('http://0.0.0.0:0000/queue')
  expect(result).toStrictEqual([])
  expect(consoleError).toHaveBeenCalled()
})
