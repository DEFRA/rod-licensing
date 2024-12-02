import { processDlq } from '../process-transaction-dlq.js'
import { retrieveStagedTransaction } from '../retrieve-transaction.js'
import { createStagingExceptionFromError } from '../../exceptions/exceptions.service.js'
import { TRANSACTION_STAGING_TABLE } from '../../../config.js'
import { UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { docClient } from '../../../../../connectors-lib/src/aws.js'

let mockProcessingException
jest.mock('../process-transaction-queue.js', () => ({
  processQueue: async () => {
    if (mockProcessingException) {
      throw mockProcessingException
    }
  }
}))

jest.mock('../retrieve-transaction.js', () => ({
  retrieveStagedTransaction: jest.fn(async () => ({ testTransaction: true }))
}))

jest.mock('../../exceptions/exceptions.service.js')

jest.mock('../../../../../connectors-lib/src/aws.js', () => ({
  docClient: {
    send: jest.fn()
  }
}))

const expectDynamoDbTtlUpdate = () => {
  expect(docClient.send).toHaveBeenCalledTimes(1)
  const updateCommandInstance = docClient.send.mock.calls[0][0]
  expect(updateCommandInstance).toBeInstanceOf(UpdateCommand)
  expect(updateCommandInstance.input).toEqual({
    TableName: TRANSACTION_STAGING_TABLE.TableName,
    Key: { id: 'test' },
    ConditionExpression: 'attribute_exists(id)',
    UpdateExpression: 'SET expires = :expires',
    ExpressionAttributeValues: {
      ':expires': expect.any(Number)
    }
  })
}

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
  })
  beforeEach(() => {
    mockProcessingException = new Error('Test error')
    jest.clearAllMocks()
  })

  describe('processDlq', () => {
    it('does not raise a staging exception if the processQueue retry attempt succeeds', async () => {
      mockProcessingException = null
      await processDlq({ id: 'test' })
      expect(createStagingExceptionFromError).not.toBeCalled()
      expect(docClient.send).not.toBeCalled()
    })

    it('creates a staging exception if the retry attempt is not successful', async () => {
      await processDlq({ id: 'test' })
      expect(createStagingExceptionFromError).toBeCalledWith('test', mockProcessingException, { testTransaction: true })
      expectDynamoDbTtlUpdate()
    })

    it('handles exceptions originating DynamoDB', async () => {
      const testDynamoDbException = new Error('DynamoDB error')
      retrieveStagedTransaction.mockRejectedValueOnce(testDynamoDbException)
      await processDlq({ id: 'test' })
      expect(createStagingExceptionFromError).toBeCalledWith('test', testDynamoDbException, null)
      expect(docClient.send).not.toHaveBeenCalled()
    })

    it('logs an exception if unable to update the TTL on the transaction in DynamoDB', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      docClient.send.mockRejectedValueOnce(new Error('DynamoDB error'))
      await processDlq({ id: 'test' })
      expect(createStagingExceptionFromError).toBeCalledWith('test', mockProcessingException, { testTransaction: true })
      expectDynamoDbTtlUpdate()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
