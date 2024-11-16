import { retrieveStagedTransaction } from '../retrieve-transaction.js'
import { docClient } from '../../../../../connectors-lib/src/aws.js'
import { GetCommand } from '@aws-sdk/lib-dynamodb'
import Boom from '@hapi/boom'
import { TRANSACTION_STAGING_TABLE, TRANSACTION_STAGING_HISTORY_TABLE } from '../../../config.js'

jest.mock('debug', () => {
  const debugMock = jest.fn()
  const loggerMock = jest.fn()
  debugMock.mockReturnValue(loggerMock)
  return debugMock
})

jest.mock('../../../../../connectors-lib/src/aws.js', () => ({
  docClient: {
    send: jest.fn()
  }
}))

describe('retrieveStagedTransaction', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestStagingTable'
    TRANSACTION_STAGING_HISTORY_TABLE.TableName = 'TestHistoryTable'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should retrieve a transaction when it is in the staging table', async () => {
    const id = 'test-id'
    const expectedItem = { id, someData: 'value' }
    docClient.send.mockResolvedValueOnce({ Item: expectedItem })

    const result = await retrieveStagedTransaction(id)

    expect(result).toEqual(expectedItem)
    expect(docClient.send).toHaveBeenCalledTimes(1)
    expect(docClient.send).toHaveBeenCalledWith(expect.any(GetCommand))

    const calledCommand = docClient.send.mock.calls[0][0]
    expect(calledCommand.input).toEqual({
      TableName: TRANSACTION_STAGING_TABLE.TableName,
      Key: { id },
      ConsistentRead: true
    })
  })

  it('should throw Boom.resourceGone if transaction is in the history table', async () => {
    const id = 'test-id'
    const historicalItem = { id, someData: 'historical data' }
    docClient.send.mockResolvedValueOnce({}).mockResolvedValueOnce({ Item: historicalItem })

    let error
    try {
      await retrieveStagedTransaction(id)
    } catch (err) {
      error = err
    }

    expect(error).toBeInstanceOf(Boom.Boom)
    expect(error.output.statusCode).toBe(410)
    expect(error.message).toBe('The transaction has already been finalised')
    expect(error.data).toEqual(historicalItem)
    expect(docClient.send).toHaveBeenCalledTimes(2)
  })

  it('should throw Boom.notFound if transaction is not found in either tables', async () => {
    const id = 'test-id'
    docClient.send.mockResolvedValueOnce({}).mockResolvedValueOnce({})

    let error
    try {
      await retrieveStagedTransaction(id)
    } catch (err) {
      error = err
    }

    expect(error).toBeInstanceOf(Boom.Boom)
    expect(error.output.statusCode).toBe(404)
    expect(error.message).toBe('A transaction for the specified identifier was not found')
    expect(docClient.send).toHaveBeenCalledTimes(2)
  })
})
