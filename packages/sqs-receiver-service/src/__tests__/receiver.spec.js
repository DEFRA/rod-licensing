import fetch from 'node-fetch'
import testEnv from '../../test-env'
import { AWS } from '@defra-fish/connectors-lib'
import { v4 as uuidv4 } from 'uuid'

// import receiver from '../receiver'


jest.mock('@defra-fish/connectors-lib', () => {
  const AWS = jest.fn(() => ({
    sqs: {
      getQueueAttributes: jest.fn(() => ({ 
        Attributes: {
          ApproximateNumberOfMessagesDelayed: 0,
          ApproximateNumberOfMessagesNotVisible: 0,
          ApproximateNumberOfMessages: 0
        }
      })),
      receiveMessage: jest.fn(() => ({
        Messages: []
      })),
      send: jest.fn()
    }
  }))
  return { AWS }
})

const getSampleMessages = (number = 1) => {
  const Messages = []
  for (let i = 0; i < number; i++) {
    Messages.push({
      MessageId: uuidv4(),
      ReceiptHandle: '15eb8abc-c7c1-4167-9590-839c8feed6dd#9be8971c-f9a9-4bb2-8515-98cdab660e1b',
      Body: `{"id":"${uuidv4()}"}`,
      Attributes: {
        MessageGroupId: 'service-1'
      }
    })
  }
  return {
    ResponseMetadata: {
      RequestId: '00000000-0000-0000-0000-000000000000'
    },
    Messages
  }
}

let receiver
let sqs

beforeEach(() => {
  jest.clearAllMocks()
  process.env = Object.assign(process.env, testEnv)
  receiver = require('../receiver').default
  if (!sqs) {
    sqs = AWS.mock.results[0].value.sqs
  }
})

afterAll(() => {
  jest.clearAllMocks()
})

test('One message: completes without error', async () => {
  sqs.receiveMessage.mockResolvedValueOnce(getSampleMessages())
  fetch.__goodResult()
  await expect(receiver()).resolves.toBeUndefined()
})

test('No messages: complete without error', async () => {
  fetch.__goodResult()
  await expect(receiver()).resolves.toBeUndefined()
})

test('10 messages: complete without error', async () => {
  sqs.receiveMessage.mockResolvedValueOnce(getSampleMessages(10))
  fetch.__goodResult()
  await expect(receiver()).resolves.toBeUndefined()
})

test('Imposes delay after several empty reads', async () => {
  sqs.receiveMessage.mockResolvedValueOnce({ Messages: [] })
  fetch.__goodResult()
  const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation(cb => cb())
  for (let i = 0; i < testEnv.TEST_ATTEMPTS_WITH_NO_DELAY; i++) {
    await expect(receiver()).resolves.toBeUndefined()
  }
  expect(setTimeoutSpy).toHaveBeenCalled()
})

test('Receiver: throws exception on general error', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  const queueError = new Error('connect ECONNREFUSED 0.0.0.0:9325')
  queueError.code = 'NetworkingError'
  sqs.receiveMessage.mockRejectedValueOnce(queueError)

  await expect(receiver()).rejects.toThrow(Error)
  expect(consoleError).toHaveBeenCalled()
})
