import Boom from '@hapi/boom'
import db from 'debug'
import { retrieveStagedTransaction } from '../retrieve-transaction.js'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_STAGING_HISTORY_TABLE } from '../../../config.js'
import { AWS } from '@defra-fish/connectors-lib'
const { docClient } = AWS.mock.results[0].value
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'sales:transactions')]

jest.mock('debug', () => jest.fn(() => jest.fn()))

jest.mock('@defra-fish/connectors-lib', () => {
  const mockAWS = {
    docClient: {
      get: jest.fn()
    }
  }
  return {
    AWS: jest.fn(() => mockAWS)
  }
})

const mockResultWithItem = (item = 'foo') => ({
  Item: item
})

describe('retrieve-transaction', () => {
  it('checks the staging table for a match', async () => {
    const id = 'foo'
    docClient.get.mockResolvedValueOnce(mockResultWithItem())

    await retrieveStagedTransaction(id)

    expect(docClient.get).toHaveBeenCalledWith({ TableName: TRANSACTION_STAGING_TABLE.TableName, Key: { id }, ConsistentRead: true })
  })

  describe('when the result has an item', () => {
    it('logs that it has retrieved a record', async () => {
      const id = 'foo'
      docClient.get.mockResolvedValueOnce(mockResultWithItem())

      await retrieveStagedTransaction(id)

      expect(debug).toHaveBeenCalledWith('Retrieved transaction record for staging id %s', id)
    })

    it('returns the result item', async () => {
      const expectedItem = Symbol('Item')
      docClient.get.mockResolvedValueOnce(mockResultWithItem(expectedItem))

      const transactionResult = await retrieveStagedTransaction('foo')

      expect(transactionResult).toEqual(expectedItem)
    })
  })

  describe('when the result does not have an item', () => {
    it('logs that it has failed to retrieve a record', async () => {
      const id = 'foo'
      docClient.get.mockResolvedValueOnce({}).mockResolvedValueOnce(mockResultWithItem())

      try {
        await retrieveStagedTransaction(id)
      } catch {
        expect(debug).toHaveBeenCalledWith('Failed to retrieve a transaction with staging id %s', id)
      }
    })

    it('checks the historical staging table for a match', async () => {
      const id = 'foo'
      docClient.get.mockResolvedValueOnce({}).mockResolvedValueOnce(mockResultWithItem())

      try {
        await retrieveStagedTransaction(id)
      } catch {
        expect(docClient.get).toHaveBeenCalledWith({
          TableName: TRANSACTION_STAGING_HISTORY_TABLE.TableName,
          Key: { id },
          ConsistentRead: true
        })
      }
    })

    it('throws a 410 Gone error if there is not a historical match', async () => {
      const historicalItem = Symbol('historicalItem')
      docClient.get.mockResolvedValueOnce({}).mockResolvedValueOnce(mockResultWithItem(historicalItem))

      await expect(retrieveStagedTransaction('foo')).rejects.toThrow(
        Boom.resourceGone('The transaction has already been finalised', historicalItem)
      )
    })

    it('throws a 404 Not Found error if there is not a historical match', async () => {
      docClient.get.mockResolvedValueOnce({}).mockResolvedValueOnce({})

      await expect(retrieveStagedTransaction('foo')).rejects.toThrow(
        Boom.notFound('A transaction for the specified identifier was not found')
      )
    })
  })
})
