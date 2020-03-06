import AWS from 'aws-sdk'
import receiver from '../receiver'
import fetch from 'node-fetch'

test('Complete without error', async () => {
  AWS.__mockOneMessage()
  fetch.__goodResult()
  await expect(receiver()).resolves.toBeUndefined()
})

test('Receiver: throws exception on general error', async () => {
  AWS.__mockFailNoQueue()

  async function check () {
    try {
      await receiver()
    } catch (error) {
      throw new Error()
    }
  }
  await expect(check()).rejects.toThrow(Error)
})
