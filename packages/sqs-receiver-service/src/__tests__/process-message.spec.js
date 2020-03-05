import processMessage from '../process-message.js'
import fetch from 'node-fetch'

test('process-message returns payload', async () => {
  fetch.__goodResult()
  const result = await processMessage({ Attributes: { MessageGroupId: 'messageId' }, ReceiptHandle: '123' }, 'http://0.0.0.0/')
  expect(result).toEqual({
    handle: '123',
    status: 200
  })
})

test('process-message returns payload with no message group', async () => {
  fetch.__goodResult()
  const result = await processMessage({ Attributes: { }, ReceiptHandle: '123' }, 'http://0.0.0.0/')
  expect(result).toEqual({
    handle: '123',
    status: 200
  })
})

test('process-message bad gateway', async () => {
  fetch.__BadGateway()
  const result = await processMessage({ Attributes: { }, ReceiptHandle: '2342' }, 'http://0.0.0.0/')
  expect(result).toEqual({
    error: 'Bad Gateway',
    handle: '2342',
    message: 'Bad Gateway',
    status: 502
  })
})

test('Completes on not found error', async () => {
  fetch.__NotFound()
  const result = await processMessage({ MessageId: '123', Attributes: {}, ReceiptHandle: '2342' }, 'http://0.0.0.0/')
  await expect(result).toStrictEqual({
    id: '123',
    handle: '2342',
    status: 500,
    message: 'Error'
  })
})
