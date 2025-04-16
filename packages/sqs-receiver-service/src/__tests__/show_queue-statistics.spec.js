import { AWS } from '@defra-fish/connectors-lib'
import showQueueStatistics from '../show-queue-statistics.js'
import testEnv from '../../test-env'
import debug from 'debug'
const { mock: { results: [{ value: { sqs } }] } } = AWS

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    sqs: {
      getQueueAttributes: jest.fn(() => ({
        Attributes: {
          ApproximateNumberOfMessages: 0,
          ApproximateNumberOfMessagesNotVisible: 0,
          ApproximateNumberOfMessagesDelayed: 0
        }
      }))
    }
  }))
}))

beforeEach(() => {
  process.env = Object.assign(process.env, testEnv)
  sqs.getQueueAttributes.mockClear()
})

test('shows queue statistics when debug is enabled', async () => {
  debug.enable('sqs:queue-stats')
  const check = async () => {
    await showQueueStatistics('http://0.0.0.0:0000/queue')
    await showQueueStatistics('http://0.0.0.0:0000/queue')
  }
  await expect(check()).resolves.toBeUndefined()
  expect(sqs.getQueueAttributes).toHaveBeenCalledTimes(2)
})

test('does not throw errors if the AWS API call fails', async () => {
  sqs.getQueueAttributes.mockRejectedValueOnce(new Error('AWS API call failed'))
  debug.enable('sqs:queue-stats')
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  await expect(showQueueStatistics('http://0.0.0.0:0000/queue')).resolves.toBeUndefined()
  expect(sqs.getQueueAttributes).toHaveBeenCalledTimes(1)
  expect(consoleError).toHaveBeenCalled()
})

test('does not query queue statistics if debug is not enabled', async () => {
  debug.disable()
  await expect(showQueueStatistics('http://0.0.0.0:0000/queue')).resolves.toBeUndefined()
  expect(sqs.getQueueAttributes).not.toHaveBeenCalled()
})
