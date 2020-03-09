import AWS from 'aws-sdk'
import receiver from '../receiver'
import fetch from 'node-fetch'

beforeEach(() => {
  jest.clearAllMocks()
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
