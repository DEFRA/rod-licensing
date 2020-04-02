'use strict'

import AWS, { GetQueueAttributesMockImplementation } from 'aws-sdk'
import testEnv from '../../test-env'
import debug from 'debug'

beforeEach(() => {
  process.env = Object.assign(process.env, testEnv)
  GetQueueAttributesMockImplementation.mockClear()
})

test('shows queue statistics when debug is enabled', async () => {
  debug.enable('sqs:queue-stats')
  const { default: showQueueStatistics } = require('../show-queue-statistics')
  const check = async () => {
    await showQueueStatistics('http://0.0.0.0:0000/queue')
    await showQueueStatistics('http://0.0.0.0:0000/queue')
  }
  await expect(check()).resolves.toBeUndefined()
  expect(GetQueueAttributesMockImplementation).toHaveBeenCalledTimes(2)
})

test('does not throw errors if the AWS API call fails', async () => {
  AWS.__mockGetAttributesThrows()
  debug.enable('sqs:queue-stats')
  const { default: showQueueStatistics } = require('../show-queue-statistics')
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  await expect(showQueueStatistics('http://0.0.0.0:0000/queue')).resolves.toBeUndefined()
  expect(GetQueueAttributesMockImplementation).toHaveBeenCalledTimes(1)
  expect(consoleError).toHaveBeenCalled()
})

test('does not query queue statistics if debug is not enabled', async () => {
  debug.disable()
  const { default: showQueueStatistics } = require('../show-queue-statistics')
  await expect(showQueueStatistics('http://0.0.0.0:0000/queue')).resolves.toBeUndefined()
  expect(GetQueueAttributesMockImplementation).not.toHaveBeenCalled()
})
