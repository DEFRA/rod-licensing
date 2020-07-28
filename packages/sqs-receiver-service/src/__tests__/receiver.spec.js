import AWS from 'aws-sdk'
import fetch from 'node-fetch'
import testEnv from '../../test-env'

let receiver

beforeEach(() => {
  jest.clearAllMocks()
  process.env = Object.assign(process.env, testEnv)
  receiver = require('../receiver').default
})

afterAll(() => {
  jest.clearAllMocks()
})

test('One message: completes without error', async () => {
  AWS.__mockOneMessage()
  fetch.__goodResult()
  await expect(receiver()).resolves.toBeUndefined()
})

test('No messages: complete without error', async () => {
  AWS.__mockEmptyQueue()
  fetch.__goodResult()
  await expect(receiver()).resolves.toBeUndefined()
})

test('10 messages: complete without error', async () => {
  AWS.__mockNMessages(10)
  fetch.__goodResult()
  await expect(receiver()).resolves.toBeUndefined()
})

test('Imposes delay after several empty reads', async () => {
  AWS.__mockEmptyQueue()
  fetch.__goodResult()
  jest.useFakeTimers()
  for (let i = 0; i < testEnv.TEST_ATTEMPTS_WITH_NO_DELAY; i++) {
    process.nextTick(() => {
      jest.runAllTimers()
    })
    await expect(receiver()).resolves.toBeUndefined()
  }
  expect(setTimeout).toHaveBeenCalled()
  jest.useRealTimers()
})

test('Receiver: throws exception on general error', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  AWS.__mockFailNoQueue()
  await expect(receiver()).rejects.toThrow(Error)
  expect(consoleError).toHaveBeenCalled()
})
