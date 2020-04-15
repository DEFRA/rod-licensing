import { createTransactionSchema, createTransactionResponseSchema } from '../transaction.schema.js'
import { mockTransactionPayload, mockTransactionRecord } from '../../../__mocks__/test-data.js'

jest.mock('../validators/index.js', () => ({
  createOptionSetValidator: optionSetName => {
    return async value => undefined
  },
  createEntityIdValidator: (entityType, negate = false) => {
    return async value => undefined
  },
  createAlternateKeyValidator: (entityType, alternateKeyProperty, negate = false) => {
    return async value => undefined
  },
  createReferenceDataEntityValidator: entityType => {
    return async value => undefined
  }
}))

describe('createTransactionSchema', () => {
  it('validates successfully', async () => {
    const result = await createTransactionSchema.validateAsync(mockTransactionPayload())
    expect(result).toBeInstanceOf(Object)
  })
})

describe('createTransactionResponseSchema', () => {
  it('validates successfully', async () => {
    const result = await createTransactionResponseSchema.validateAsync(mockTransactionRecord())
    expect(result).toBeInstanceOf(Object)
  })

  it('detects duplicate permission numbers', async () => {
    const record = mockTransactionRecord()
    record.permissions.push(record.permissions[0])

    await expect(createTransactionResponseSchema.validateAsync(record)).rejects.toThrow(
      'The permissions list contains duplicate reference numbers: 11100420-2WT1SFT-KPMW2C (create-transaction-response-permissions)'
    )
  })
})
