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
    const result = await createTransactionSchema.validateAsync(mockPayload)
    expect(result).toBeInstanceOf(Object)
  })

  it('requires a licensee postcode for web-sales but not for post-office sales', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.permissions.forEach(p => {
      p.licensee.postcode = ''
    })
    await expect(createTransactionSchema.validateAsync(mockPayload)).rejects.toThrow(
      '"permissions[0].licensee.postcode" is not allowed to be empty'
    )

    mockPayload.dataSource = 'Post Office Sales'
    const result = await createTransactionSchema.validateAsync(mockPayload)
    expect(result).toBeInstanceOf(Object)
  })

  it('requires a licensee postcode for web-sales but not for dde sales', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.permissions.forEach(p => {
      p.licensee.postcode = ''
    })
    await expect(createTransactionSchema.validateAsync(mockPayload)).rejects.toThrow(
      '"permissions[0].licensee.postcode" is not allowed to be empty'
    )

    mockPayload.dataSource = 'DDE File'
    const result = await createTransactionSchema.validateAsync(mockPayload)
    expect(result).toBeInstanceOf(Object)
  })

  it('allows isLicenceForYou to be true', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.permissions[0].isLicenceForYou = true
    const result = await createTransactionSchema.validateAsync(mockTransactionPayload())
    expect(result).toBeInstanceOf(Object)
  })

  it('allows isLicenceForYou to be false', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.permissions[0].isLicenceForYou = false
    const result = await createTransactionSchema.validateAsync(mockTransactionPayload())
    expect(result).toBeInstanceOf(Object)
  })

  it('does not allow isLicenceForYou to be a string', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.permissions[0].isLicenceForYou = 'test'
    await expect(createTransactionSchema.validateAsync(mockPayload)).rejects.toThrow('"permissions[0].isLicenceForYou" must be a boolean')
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
