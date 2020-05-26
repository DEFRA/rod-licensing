import { createTransactionSchema, createTransactionResponseSchema } from '../transaction.schema.js'
import { mockTransactionPayload, mockTransactionRecord } from '../../__mocks__/test-data.js'

jest.mock('../validators/validators.js', () => ({
  ...jest.requireActual('../validators/validators.js'),
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
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
})
