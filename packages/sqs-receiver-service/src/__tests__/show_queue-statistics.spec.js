'use strict'

import showQueueStatistics from '../show-queue-statistics'
// import AWS from 'aws-sdk'

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
