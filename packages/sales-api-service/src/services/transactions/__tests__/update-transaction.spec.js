import { updateTransactionSourceAndPaymentType } from '../update-transaction.js'
import { TRANSACTION_STAGING_TABLE } from '../../../config.js'
import { AWS } from '@defra-fish/connectors-lib'
import { TRANSACTION_SOURCE } from '@defra-fish/business-rules-lib'
import db from 'debug'

jest.mock('debug', () => jest.fn(() => jest.fn()))
jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    docClient: {
      update: jest.fn(),
      createUpdateExpression: jest.fn()
    }
  }))
}))

jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'sales:transactions')]

describe('updateTransactionSourceAndPaymentType', () => {
  const { docClient } = AWS.mock.results[0].value

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it.each([['Debit card'], ['Credit card']])(
    'should call docClient.createUpdateExpression with correct payload when type is %s',
    async type => {
      const transactionId = 'transaction-id'
      const updateExpression = { expression: 'mock-expression' }
      docClient.createUpdateExpression.mockReturnValue(updateExpression)
      docClient.update.mockResolvedValue({ Attributes: { id: transactionId, payment: { source: 'Gov Pay', method: type } } })

      await updateTransactionSourceAndPaymentType(transactionId, type)

      expect(docClient.createUpdateExpression).toHaveBeenCalledWith({
        payment: {
          source: TRANSACTION_SOURCE.govPay,
          method: type
        }
      })
    }
  )

  it('should call docClient.update with expected parameters', async () => {
    const transactionId = 'transaction-id'
    const type = 'Credit card'
    const updateExpression = { expression: 'mock-expression' }
    const updatedRecord = { id: transactionId, payment: { source: 'Gov Pay', method: type } }

    docClient.createUpdateExpression.mockReturnValue(updateExpression)
    docClient.update.mockResolvedValue({ Attributes: updatedRecord })

    const result = await updateTransactionSourceAndPaymentType(transactionId, type)

    expect(docClient.update).toHaveBeenCalledWith({
      TableName: TRANSACTION_STAGING_TABLE.TableName,
      Key: { id: transactionId },
      ...updateExpression,
      ReturnValues: 'ALL_NEW'
    })

    expect(result).toEqual(updatedRecord)
  })

  it('should call debug with the transaction id', async () => {
    const transactionId = 'transaction-id'
    const type = 'Debit card'
    docClient.createUpdateExpression.mockReturnValue({})
    docClient.update.mockResolvedValue({ Attributes: { id: transactionId } })

    await updateTransactionSourceAndPaymentType(transactionId, type)

    expect(debug).toHaveBeenCalledWith('Updating transaction %s', transactionId)
  })
})
