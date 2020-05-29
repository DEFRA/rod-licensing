import { processDlq } from '../process-transaction-dlq.js'
import { TRANSACTIONS_STAGING_TABLE } from '../../../config.js'

const awsMock = require('aws-sdk').default

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

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  persist: jest.fn()
}))

expect.extend({
  jsonMatching (received, ...matchers) {
    try {
      const obj = JSON.parse(received)
      for (const matcher of matchers) {
        if (!matcher.asymmetricMatch(obj)) {
          return {
            message: () => `expected ${matcher.toString()} to pass`,
            pass: false
          }
        }
      }
      return {
        pass: true
      }
    } catch (e) {
      return {
        message: () => 'expected a valid json structure',
        pass: false
      }
    }
  }
})

const expectDynamoDbTtlUpdate = () => {
  expect(awsMock.DynamoDB.DocumentClient.mockedMethods.update).toBeCalledWith(
    expect.objectContaining({
      TableName: TRANSACTIONS_STAGING_TABLE.TableName,
      Key: { id: 'test' },
      ConditionExpression: 'attribute_exists(id)',
      UpdateExpression: 'SET expires = :expires',
      ExpressionAttributeValues: {
        ':expires': expect.any(Number)
      }
    })
  )
}

describe('transaction service', () => {
  beforeAll(() => {
    TRANSACTIONS_STAGING_TABLE.TableName = 'TestTable'
  })
  beforeEach(() => {
    mockProcessingException = new Error('Test error')
    awsMock.__resetAll()
  })

  describe('processDlq', () => {
    it('does not raise a staging exception if the processQueue retry attempt succeeds', async () => {
      mockProcessingException = null
      const dynamicsLib = require('@defra-fish/dynamics-lib')
      await processDlq({ id: 'test' })
      expect(dynamicsLib.persist).not.toBeCalled()
      expect(awsMock.DynamoDB.DocumentClient.mockedMethods.update).not.toBeCalled()
    })

    it('creates a staging exception for a generic processing error', async () => {
      const dynamicsLib = require('@defra-fish/dynamics-lib')
      await processDlq({ id: 'test' })
      const expectedMessage = 'Error: Test error'
      expect(dynamicsLib.persist).toBeCalledWith(
        expect.objectContaining({
          stagingId: 'test',
          description: expectedMessage,
          exceptionJson: expect.jsonMatching(
            expect.objectContaining({
              transaction: { testTransaction: true },
              exception: {
                stack: expect.arrayContaining([expectedMessage, ...mockProcessingException.stack.split('\n')])
              }
            })
          )
        })
      )
      expectDynamoDbTtlUpdate()
    })

    it('handles exceptions originating from a Dynamics call', async () => {
      const expectedMessage = 'Custom dynamics error message'
      mockProcessingException = Object.assign(new Error(), { error: { message: expectedMessage } })
      const dynamicsLib = require('@defra-fish/dynamics-lib')
      await processDlq({ id: 'test' })
      expect(dynamicsLib.persist).toBeCalledWith(
        expect.objectContaining({
          stagingId: 'test',
          description: expectedMessage,
          exceptionJson: expect.jsonMatching(
            expect.objectContaining({
              transaction: { testTransaction: true },
              exception: {
                error: expect.anything(),
                stack: expect.arrayContaining([...mockProcessingException.stack.split('\n')])
              }
            })
          )
        })
      )
      expectDynamoDbTtlUpdate()
    })

    it('handles exceptions originating DynamoDB', async () => {
      const dynamicsLib = require('@defra-fish/dynamics-lib')
      const testDynamoDbException = new Error('DynamoDB error')
      require('../retrieve-transaction.js').retrieveStagedTransaction.mockImplementationOnce(() => {
        throw testDynamoDbException
      })
      await processDlq({ id: 'test' })
      const expectedMessage = 'Error: DynamoDB error'
      expect(dynamicsLib.persist).toBeCalledWith(
        expect.objectContaining({
          stagingId: 'test',
          description: expectedMessage,
          exceptionJson: expect.jsonMatching(
            expect.objectContaining({
              transaction: null,
              exception: {
                stack: expect.arrayContaining([expectedMessage, ...testDynamoDbException.stack.split('\n')])
              }
            })
          )
        })
      )
      expectDynamoDbTtlUpdate()
    })

    it('logs an exception if unable to update the TTL on the transaction in DynamoDB', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      awsMock.DynamoDB.DocumentClient.__throwWithErrorOn('update')
      const dynamicsLib = require('@defra-fish/dynamics-lib')
      await processDlq({ id: 'test' })
      const expectedMessage = 'Error: Test error'
      expect(dynamicsLib.persist).toBeCalledWith(
        expect.objectContaining({
          stagingId: 'test',
          description: expectedMessage,
          exceptionJson: expect.jsonMatching(
            expect.objectContaining({
              transaction: { testTransaction: true },
              exception: {
                stack: expect.arrayContaining([expectedMessage, ...mockProcessingException.stack.split('\n')])
              }
            })
          )
        })
      )
      expectDynamoDbTtlUpdate()
      expect(consoleErrorSpy).toHaveBeenCalled()
    })
  })
})
