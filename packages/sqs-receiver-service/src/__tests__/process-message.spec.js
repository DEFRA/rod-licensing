import processMessage from '../process-message.js'
import fetch from 'node-fetch'

test('process-message returns payload', async () => {
  fetch.__goodResult()
  const result = await processMessage(
    { MessageId: 'test1', Attributes: { MessageGroupId: 'messageId' }, ReceiptHandle: '123', Body: 'test body' },
    'http://0.0.0.0/'
  )
  expect(result).toMatchObject(
    expect.objectContaining({
      id: 'test1',
      handle: '123',
      status: 200,
      statusText: 'OK',
      requestBody: 'test body',
      responseBody: expect.any(String)
    })
  )
})

test('process-message returns payload with no message group', async () => {
  fetch.__goodResult()
  const result = await processMessage({ MessageId: 'test2', Attributes: {}, ReceiptHandle: '123', Body: 'test body' }, 'http://0.0.0.0/')
  expect(result).toMatchObject(
    expect.objectContaining({
      id: 'test2',
      handle: '123',
      status: 200,
      statusText: 'OK',
      requestBody: 'test body',
      responseBody: expect.any(String)
    })
  )
})

test('process-message bad gateway', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  fetch.__BadGateway()
  const result = await processMessage({ MessageId: 'test3', Attributes: {}, ReceiptHandle: '2342', Body: 'test body' }, 'http://0.0.0.0/')
  expect(result).toMatchObject(
    expect.objectContaining({
      id: 'test3',
      handle: '2342',
      status: 502,
      statusText: 'Bad Gateway',
      requestBody: 'test body',
      responseBody: expect.any(String)
    })
  )
  expect(consoleError).toHaveBeenCalled()
})

test('Completes on not found error', async () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  fetch.__NotFound()
  const result = await processMessage({ MessageId: 'test4', Attributes: {}, ReceiptHandle: '2342', Body: 'test body' }, 'http://0.0.0.0/')
  expect(result).toEqual({
    id: 'test4',
    handle: '2342',
    status: 500,
    requestBody: 'test body',
    responseBody: 'Error',
    error: expect.any(Error)
  })
  expect(consoleError).toHaveBeenCalled()
})
