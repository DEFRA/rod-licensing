import {
  createTransactionSchema,
  createTransactionResponseSchema,
  finaliseTransactionResponseSchema,
  retrieveStagedTransactionParamsSchema,
  updateTransactionRequestSchema,
  updateTransactionResponseSchema
} from '../transaction.schema.js'
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

  it('validates successfully when recurring payment detail is supplied', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.recurringPayment = {
      agreementId: 't3jl08v2nqqmujrnhs09pmhtjx',
      id: 'fdc73d20-a0bf-4da6-9a49-2f0a24bd3509'
    }
    await expect(createTransactionSchema.validateAsync(mockPayload)).resolves.not.toThrow()
  })

  it('validates successfully when recurring payment detail is omitted', async () => {
    const mockPayload = mockTransactionPayload()
    await expect(createTransactionSchema.validateAsync(mockPayload)).resolves.not.toThrow()
  })

  it('fails validation if agreement id is omitted from recurring payment detail', async () => {
    const mockPayload = mockTransactionPayload()
    mockPayload.recurringPayment = { id: 'fdc73d20-a0bf-4da6-9a49-2f0a24bd3509' }
    await expect(() => createTransactionSchema.validateAsync(mockPayload)).rejects.toThrow()
  })

  it.each([
    ['agreement id is too long', { agreementId: 'thisistoolongtobeanagreementid' }],
    ['agreement id is too short', { agreementId: 'tooshorttobeanagreementid' }],
    ['agreement id contains invalid characters', '!3j@08v2nqqmujrnhs09_mhtjx'],
    ['agreement id is null', { agreementId: null }],
    ['agreement id is a numeric', { agreementId: 4567 }],
    ['id is not a guid', { id: 'not-a-guid' }],
    ['id is null', { id: null }]
  ])('fails validation if %s', async (_d, recurringPayment) => {
    const mockPayload = mockTransactionPayload()
    mockPayload.recurringPayment = {
      agreementId: 'jhyu78iujhy7u87y6thu87uyj8',
      id: '7a0660ec-8535-4357-b925-e598a9358119',
      ...recurringPayment
    }
    await expect(() => createTransactionSchema.validateAsync(mockPayload)).rejects.toThrow()
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

describe('retrieveStagedTransactionParamsSchema', () => {
  it.each([
    ['36fb757c-6377-49c5-ab6e-32eb9782fcf0'],
    ['c290b78d-3bbc-4445-b4dd-b36f6ee044a2'],
    ['2323a890-b36f-47b1-ab9f-d60e292ac4ae'],
    ['9c6b79be-28be-4916-aa5c-08520aa1e804']
  ])('validates successfully when a uuid v4 transactionId is %s', async transactionId => {
    const sampleData = { id: transactionId }
    await expect(retrieveStagedTransactionParamsSchema.validateAsync(sampleData)).resolves.not.toThrow()
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
    const sampleData = { id: transactionId }
    await expect(() => retrieveStagedTransactionParamsSchema.validateAsync(sampleData)).rejects.toThrow()
  })

  it('throws an error if id missing', async () => {
    await expect(() => retrieveStagedTransactionParamsSchema.validateAsync({}).rejects.toThrow())
  })
})

describe('updateTransactionRequestSchema', () => {
  it('validates successfully with a valid payment object', async () => {
    const sample = {
      payment: {
        source: 'Gov Pay',
        method: 'Debit card'
      }
    }
    const result = await updateTransactionRequestSchema.validateAsync(sample)
    expect(result).toEqual(sample)
  })

  it('fails when payment.method is invalid', async () => {
    const sample = {
      payment: {
        source: 'Gov Pay',
        method: 'SomeOtherMethod'
      }
    }
    await expect(updateTransactionRequestSchema.validateAsync(sample)).rejects.toThrow()
  })

  it('fails when payment.source is invalid', async () => {
    const sample = {
      payment: {
        source: 'SomeOtherSource',
        method: 'Debit card'
      }
    }
    await expect(updateTransactionRequestSchema.validateAsync(sample)).rejects.toThrow()
  })
})

describe('updateTransactionResponseSchema', () => {
  it('validates successfully with a transaction containing payment', async () => {
    const mockRecord = mockStagedTransactionRecord()
    mockRecord.payment = {
      source: 'Gov Pay',
      method: 'Debit card'
    }

    const result = await updateTransactionResponseSchema.validateAsync(mockRecord)
    expect(result).toBeInstanceOf(Object)
  })

  it('fails when payment is missing', async () => {
    const mockRecord = mockStagedTransactionRecord()
    delete mockRecord.payment
    await expect(updateTransactionResponseSchema.validateAsync(mockRecord)).rejects.toThrow('"payment" is required')
  })

  it('fails when payment.method is invalid', async () => {
    const mockRecord = mockStagedTransactionRecord()
    mockRecord.payment = { source: 'Gov Pay', method: 'SomethingElse' }
    await expect(updateTransactionResponseSchema.validateAsync(mockRecord)).rejects.toThrow()
  })

  it('fails when payment.source is invalid', async () => {
    const mockRecord = mockStagedTransactionRecord()
    mockRecord.payment = { source: 'SomethingElse', method: 'Debit card' }
    await expect(updateTransactionResponseSchema.validateAsync(mockRecord)).rejects.toThrow()
  })
})
