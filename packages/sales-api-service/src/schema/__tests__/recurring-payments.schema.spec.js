import { dueRecurringPaymentsResponseSchema } from '../recurring-payments.schema.js'

jest.mock('../validators/validators.js', () => ({
  ...jest.requireActual('../validators/validators.js'),
  createEntityIdValidator: () => () => {} // sample data so we don't want it validated for being a real entity id
}))

const getSampleData = () => ({
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

describe('getDueRecurringPaymentsSchema', () => {
  it('validates expected object', async () => {
    await expect(() => dueRecurringPaymentsResponseSchema.validateAsync(getSampleData())).not.toThrow()
  })

  it.each(['name', 'nextDueDate', 'endDate', 'agreementId'])('throws an error if %s is missing', async property => {
    const sampleData = getSampleData()
    delete sampleData[property]
    expect(() => dueRecurringPaymentsResponseSchema.validateAsync(sampleData)).rejects.toThrow()
  })

  it.each([
    ['name', 99],
    ['nextDueDate', 'not-a-date'],
    ['agreementId', 'not-a-guid'],
    ['contactId', 'still-not-a-guid']
  ])('throws an error if %s is not the correct type', async (property, value) => {
    const sampleData = getSampleData()
    sampleData[property] = value
    expect(() => dueRecurringPaymentsResponseSchema.validateAsync(sampleData)).rejects.toThrow()
  })
})
