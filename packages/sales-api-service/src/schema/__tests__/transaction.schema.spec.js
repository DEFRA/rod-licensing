import { createTransactionSchema, createTransactionResponseSchema, finaliseTransactionResponseSchema } from '../transaction.schema.js'
import { mockTransactionPayload, mockStagedTransactionRecord, mockFinalisedTransactionRecord } from '../../__mocks__/test-data.js'

jest.mock('../validators/validators.js', () => ({
  ...jest.requireActual('../validators/validators.js'),
  createOptionSetValidator: () => async () => undefined,
  createEntityIdValidator: () => async () => undefined,
  createAlternateKeyValidator: () => async () => undefined,
  createReferenceDataEntityValidator: () => async () => undefined,
  createPermitConcessionValidator: () => async () => undefined
}))

describe('createTransactionSchema', () => {
  it('validates successfully when issueDate and startDate are supplied', async () => {
    const result = await createTransactionSchema.validateAsync(mockTransactionPayload())
    expect(result).toBeInstanceOf(Object)
  })

  it('validates successfully when issueDate and startDate are null', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.permissions.map(p => ({ ...p, issueDate: null, startDate: null }))
    const result = await createTransactionSchema.validateAsync(mockTransactionPayload())
    expect(result).toBeInstanceOf(Object)
  })
})

describe('createTransactionResponseSchema', () => {
  it('validates successfully', async () => {
    const result = await createTransactionResponseSchema.validateAsync(mockStagedTransactionRecord())
    expect(result).toBeInstanceOf(Object)
  })
})

describe('finaliseTransactionResponseSchema', () => {
  it('validates successfully', async () => {
    const mockRecord = mockFinalisedTransactionRecord()
    mockRecord.status.messageId = 'test_message_id'
    const result = await finaliseTransactionResponseSchema.validateAsync(mockRecord)
    expect(result).toBeInstanceOf(Object)
  })
})
