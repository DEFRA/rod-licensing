
import AWS from 'aws-sdk'
import receiver from '../src/receiver'

test('Receiver: terminate on general error', async () => {
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
