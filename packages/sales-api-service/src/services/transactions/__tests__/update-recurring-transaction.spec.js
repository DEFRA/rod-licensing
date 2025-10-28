import { updateRecurringTransaction } from '../update-recurring-transaction.js'
import { AWS } from '@defra-fish/connectors-lib'
import { TRANSACTION_STAGING_TABLE } from '../../../config.js'

const { docClient } = AWS.mock.results[0].value

jest.mock('@defra-fish/connectors-lib', () => {
  const awsMock = {
    docClient: {
      createUpdateExpression: jest.fn(() => ({})),
      update: jest.fn(() => ({ Attributes: { id: 'txn-123', payment: { source: 'Gov Pay', method: 'Debit card' } } }))
    }
  }
  return {
    AWS: jest.fn(() => awsMock)
  }
})

describe('updateRecurringTransaction', () => {
  beforeAll(() => {
    TRANSACTION_STAGING_TABLE.TableName = 'TestTable'
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('updates a transaction and returns the updated record', async () => {
    const id = 'txn-123'
    const payload = { payment: { source: 'Gov Pay', method: 'Debit card' } }

    docClient.createUpdateExpression.mockReturnValueOnce({
      UpdateExpression: 'SET #payment = :payment',
      ExpressionAttributeNames: { '#payment': 'payment' },
      ExpressionAttributeValues: { ':payment': payload.payment }
    })

    docClient.update.mockResolvedValueOnce({
      Attributes: { id, ...payload }
    })

    const result = await updateRecurringTransaction({ id, ...payload })

    expect(result).toEqual({ id, ...payload })
    expect(docClient.createUpdateExpression).toHaveBeenCalledWith(payload)
    expect(docClient.update).toHaveBeenCalledWith({
      TableName: 'TestTable',
      Key: { id },
      UpdateExpression: 'SET #payment = :payment',
      ExpressionAttributeNames: { '#payment': 'payment' },
      ExpressionAttributeValues: { ':payment': payload.payment },
      ReturnValues: 'ALL_NEW'
    })
  })

  it('throws error from DynamoDB', async () => {
    docClient.update.mockRejectedValueOnce(new Error('Dynamo error'))

    await expect(updateRecurringTransaction({ id: 'bad-id', payment: {} })).rejects.toThrow('Dynamo error')
  })
})
