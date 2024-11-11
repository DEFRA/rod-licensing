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
    mockPayload.permissions = mockPayload.permissions.map(p => ({ ...p, issueDate: null, startDate: null }))
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

  it('validates successfully when a uuid v4 transactionId is supplied', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.transactionId = '25fa0126-55da-4309-9bce-9957990d141e'
    await expect(createTransactionSchema.validateAsync(mockPayload)).resolves.not.toThrow()
  })

  it('validates successfully when transactionId is omitted', async () => {
    const mockPayload = mockTransactionPayload()
    await expect(createTransactionSchema.validateAsync(mockPayload)).resolves.not.toThrow()
  })

  it.each([
    ['uuid1 string', '5a429f62-871b-11ef-b864-0242ac120002'],
    ['uuid2 string', '000003e8-871b-21ef-8000-325096b39f47'],
    ['uuid3 string', 'a3bb189e-8bf9-3888-9912-ace4e6543002'],
    ['uuid5 string', 'a6edc906-2f9f-5fb2-a373-efac406f0ef2'],
    ['uuid6 string', 'a3bb189e-8bf9-3888-9912-ace4e6543002'],
    ['uuid7 string', '01927705-ffac-77b5-89af-c97451b1bbe2'],
    ['numeric', 4567]
  ])('fails validation when provided with a %s for transactionId', async (_d, transactionId) => {
    const mockPayload = mockTransactionPayload()
    mockPayload.transactionId = transactionId
    await expect(createTransactionSchema.validateAsync(mockPayload)).rejects.toThrow()
  })

  it('validates successfully when an agreementId is supplied', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.agreementId = 't3jl08v2nqqmujrnhs09pmhtjx'
    await expect(createTransactionSchema.validateAsync(mockPayload)).resolves.not.toThrow()
  })

  it('validates successfully when agreementId is omitted', async () => {
    const mockPayload = mockTransactionPayload()
    await expect(createTransactionSchema.validateAsync(mockPayload)).resolves.not.toThrow()
  })

  it.each([
    ['too short string', 'foo'],
    ['too long string', 'foobarbazfoobarbazfoobarbaz'],
    ['string containing invalid characters', '!3j@08v2nqqmujrnhs09_mhtjx'],
    ['null', null],
    ['numeric', 4567]
  ])('fails validation when provided with a %s for agreementId', async (_d, agreementId) => {
    const mockPayload = mockTransactionPayload()
    mockPayload.agreementId = agreementId
    await expect(createTransactionSchema.validateAsync(mockPayload)).rejects.toThrow()
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
