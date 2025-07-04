import {
  dueRecurringPaymentsRequestParamsSchema,
  dueRecurringPaymentsResponseSchema,
  processRPResultRequestParamsSchema
} from '../recurring-payments.schema.js'

jest.mock('../validators/validators.js', () => ({
  ...jest.requireActual('../validators/validators.js'),
  createEntityIdValidator: () => () => {} // sample data so we don't want it validated for being a real entity id
}))

const getResponseSampleData = () => ({
  id: 'd5549fc6-41c1-ef11-b8e8-7c1e52215dc9',
  name: 'test',
  status: 0,
  nextDueDate: '2025-01-22T00:00:00.000Z',
  cancelledDate: null,
  cancelledReason: null,
  endDate: '2025-12-22T23:59:59.000Z',
  agreementId: 'c756d22b-0003-4e24-a922-009f358852bd',
  activePermission: 'cb549fc6-41c1-ef11-b8e8-7c1e52215dc9',
  contactId: 'bf549fc6-41c1-ef11-b8e8-7c1e52215dc9',
  publicId: 'q/kJYJrYNt/PkVbWChugMRSSxoDEttw1ownaNzDDyEw=',
  expanded: {
    contact: {
      entity: {
        id: 'bf549fc6-41c1-ef11-b8e8-7c1e52215dc9',
        firstName: 'Recurring',
        lastName: 'Test',
        birthDate: '1991-01-01',
        email: 'recurring.test@hotmail.com',
        mobilePhone: null,
        organisation: null,
        premises: '1',
        street: 'Catharine Place',
        locality: null,
        town: 'Bath',
        postcode: 'BA1 2PR'
      }
    },
    activePermission: {
      entity: {
        id: 'cb549fc6-41c1-ef11-b8e8-7c1e52215dc9',
        referenceNumber: '23221225-2WC3FRT-ADQFJ6',
        issueDate: '2024-12-23T15:22:49.000Z',
        startDate: '2024-12-23T15:52:49.000Z',
        endDate: '2025-12-22T23:59:59.000Z',
        stagingId: 'a544cc77-156c-40e7-9c69-02e70829341d',
        dataSource: {
          id: 910400003,
          label: 'Web Sales',
          description: 'Web Sales'
        }
      }
    }
  }
})

const getProcessRPResultSampleData = () => ({
  transactionId: 'abc123',
  paymentId: 'def456',
  createdDate: '2025-01-01T00:00:00.000Z'
})

describe('getDueRecurringPaymentsSchema', () => {
  it('validates expected object', async () => {
    expect(() => dueRecurringPaymentsResponseSchema.validateAsync(getResponseSampleData())).not.toThrow()
  })

  it.each([
    'id',
    'name',
    'status',
    'nextDueDate',
    'cancelledDate',
    'cancelledReason',
    'endDate',
    'agreementId',
    'activePermission',
    'contactId',
    'publicId'
  ])('throws an error if %s is missing', async property => {
    const sampleData = getResponseSampleData()
    delete sampleData[property]
    expect(() => dueRecurringPaymentsResponseSchema.validateAsync(sampleData)).rejects.toThrow()
  })

  it.each([
    ['id', 'not-a-guid'],
    ['name', 99],
    ['status', 'not-a-number'],
    ['nextDueDate', 'not-a-date'],
    ['cancelledDate', 'not-a-date'],
    ['cancelledReason', 99],
    ['endDate', 'not-a-date'],
    ['agreementId', 'not-a-guid'],
    ['activePermission', 'not-a-guid'],
    ['contactId', 'still-not-a-guid'],
    ['publicId', 99]
  ])('throws an error if %s is not the correct type', async (property, value) => {
    const sampleData = getResponseSampleData()
    sampleData[property] = value
    expect(() => dueRecurringPaymentsResponseSchema.validateAsync(sampleData)).rejects.toThrow()
  })

  it('snapshot test schema', async () => {
    expect(dueRecurringPaymentsResponseSchema.schema().describe()).toMatchSnapshot()
  })
})

describe('dueRecurringPaymentsRequestParamsSchema', () => {
  it('validates expected object', async () => {
    const sampleData = {
      date: '2024-12-23'
    }
    expect(() => dueRecurringPaymentsRequestParamsSchema.validateAsync(sampleData)).not.toThrow()
  })

  it('throws an error if date missing', async () => {
    expect(() => dueRecurringPaymentsRequestParamsSchema.validateAsync({}).rejects.toThrow())
  })

  it('throws an error if date is not the correct type', async () => {
    const sampleData = {
      date: 'not-a-date'
    }
    expect(() => dueRecurringPaymentsRequestParamsSchema.validateAsync(sampleData).rejects.toThrow())
  })
})

describe('processRPResultRequestParamsSchema', () => {
  it('validates expected object', async () => {
    expect(() => processRPResultRequestParamsSchema.validateAsync(getProcessRPResultSampleData())).not.toThrow()
  })

  it.each([['transactionId'], ['paymentId'], ['createdDate']])('throws an error if %s is missing', async property => {
    const sampleData = getProcessRPResultSampleData()
    delete sampleData[property]
    expect(() => processRPResultRequestParamsSchema.validateAsync(sampleData).rejects.toThrow())
  })

  it.each([
    ['transactionId', 99],
    ['paymentId', 99],
    ['createdDate', 'not-a-date']
  ])('throws an error if %s is not the correct type', async (property, value) => {
    const sampleData = getProcessRPResultSampleData()
    sampleData[property] = value
    expect(() => processRPResultRequestParamsSchema.validateAsync(sampleData).rejects.toThrow())
  })
})
