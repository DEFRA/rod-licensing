'use strict'

import showQueueStatistics from '../show-queue-statistics'
import AWS from 'aws-sdk'
import testEnv from '../../test-env'

beforeEach(() => {
  process.env = Object.assign(process.env, testEnv)
})

test('Show queue statistics', async () => {
  async function check () {
    try {
      await showQueueStatistics('http://0.0.0.0:0000/queue')
      await showQueueStatistics('http://0.0.0.0:0000/queue')
    } catch (error) {
      throw new Error()
    }
  }
  await expect(check()).resolves.toBeUndefined()
})

test('Show queue statistics does not throw on error', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  AWS.__mockGetAttributesThrows()
  async function check () {
    try {
      await showQueueStatistics('http://0.0.0.0:0000/queue')
    } catch (error) {
      throw new Error()
    }
  }
  await expect(check()).resolves.toBeUndefined()
  expect(consoleError).toHaveBeenCalled()
})
