import { salesApi, govUkPayApi } from '@defra-fish/connectors-lib'
import { execute } from '../processor.js'
import { GOVUK_PAY_ERROR_STATUS_CODES, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import moment from 'moment'

jest.mock('@defra-fish/connectors-lib')
// mock bottleneck to speed up test execution
jest.mock('bottleneck', () =>
  jest.fn(function () {
    this.wrap = fn => fn
  })
)

const journalEntries = () => [
  {
    id: '4fa393ab-07f4-407e-b233-89be2a6f5f77',
    paymentStatus: 'In Progress',
    paymentReference: '05nioqikvvnuu5l8m2qeaj0qap',
    paymentTimestamp: '2020-06-01T10:35:56.873Z'
  },
  {
    id: 'aaced854-d337-47ee-8d5e-75b26aeb90fb',
    paymentStatus: 'In Progress',
    paymentReference: '0f3dr9ugp7u68qq18vt9h8ma85',
    paymentTimestamp: '2020-06-02T07:17:23.169Z'
  },
  {
    id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8213',
    paymentStatus: 'In Progress',
    paymentReference: '7lufvi9sbh077rvrrmnqo63vme',
    paymentTimestamp: '2020-06-04T12:04:30.802Z'
  },
  {
    id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8214',
    paymentStatus: 'In Progress',
    paymentReference: '7lufvi9sbh077rvrrmnqo63vmf',
    paymentTimestamp: '2020-06-04T12:04:30.802Z'
  },
  {
    id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8215',
    paymentStatus: 'In Progress',
    paymentReference: '7lufvi9sbh077rvrrmnqo63vmg',
    paymentTimestamp: '2020-06-04T12:04:30.802Z'
  }
]

const govUkPayStatusEntries = [
  {
    payment_id: '05nioqikvvnuu5l8m2qeaj0qap',
    state: {
      status: 'success',
      finished: true
    },
    amount: 8200
  },
  {
    payment_id: '0f3dr9ugp7u68qq18vt9h8ma85',
    state: {
      code: GOVUK_PAY_ERROR_STATUS_CODES.REJECTED,
      status: 'failed',
      finished: true
    }
  },
  {
    payment_id: '7lufvi9sbh077rvrrmnqo63vme',
    state: {
      status: 'error',
      finished: true
    }
  },
  {
    payment_id: '7lufvi9sbh077rvrrmnqo63vmf',
    state: {
      code: GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED,
      status: 'cancelled',
      finished: true
    }
  },
  {
    payment_id: '7lufvi9sbh077rvrrmnqo63vmg',
    state: {
      code: GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED,
      status: 'failed',
      finished: false
    }
  }
]

// differs from other responses - see https://docs.payments.service.gov.uk/api_reference/#gov-uk-pay-api-error-codes
const govUkPayStatusNotFound = () => ({ code: 'P0200', description: 'Not found' })

const createPaymentEventsEntry = paymentStatus => {
  return {
    events: [
      {
        payment_id: paymentStatus.payment_id,
        state: {
          status: 'created',
          finished: false
        },
        updated: 'INTERIM_PAYMENT_EVENT_TIMESTAMP'
      },
      {
        payment_id: paymentStatus.payment_id,
        state: {
          status: 'started',
          finished: false
        },
        updated: 'INTERIM_PAYMENT_EVENT_TIMESTAMP'
      },
      {
        payment_id: paymentStatus.payment_id,
        state: {
          status: 'submitted',
          finished: false
        },
        updated: 'INTERIM_PAYMENT_EVENT_TIMESTAMP'
      },
      {
        payment_id: paymentStatus.payment_id,
        state: paymentStatus.state,
        updated: 'FINAL_PAYMENT_EVENT_TIMESTAMP'
      }
    ]
  }
}

describe('processor', () => {
  beforeEach(jest.clearAllMocks)

  it('completes normally where there are no journal records retrieved', async () => {
    salesApi.paymentJournals.getAll.mockReturnValue([])
    govUkPayApi.fetchPaymentStatus.mockImplementation(jest.fn())
    await execute(1, 1)
    expect(govUkPayApi.fetchPaymentStatus).not.toHaveBeenCalled()
  })

  it('completes normally where there are journal records retrieved', async () => {
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntries())
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayStatusEntries.forEach(status => {
      govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({ json: async () => status })
      govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({ json: async () => createPaymentEventsEntry(status) })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledTimes(govUkPayStatusEntries.length)
    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledTimes(govUkPayStatusEntries.filter(s => s.state.status === 'success').length)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(govUkPayStatusEntries.filter(s => s.state.status === 'success').length)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledWith('4fa393ab-07f4-407e-b233-89be2a6f5f77', {
      payment: { amount: 82, method: 'Debit card', source: 'Gov Pay', timestamp: 'FINAL_PAYMENT_EVENT_TIMESTAMP' }
    })
    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('4fa393ab-07f4-407e-b233-89be2a6f5f77', {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed
    })
    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('aaced854-d337-47ee-8d5e-75b26aeb90fb', {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed
    })
    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('a0e0e5c3-1004-4271-80ba-d05eda3e8213', {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed
    })
    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('a0e0e5c3-1004-4271-80ba-d05eda3e8214', {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Cancelled
    })
    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith('a0e0e5c3-1004-4271-80ba-d05eda3e8215', {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Expired
    })
  })

  it('calls fetchPaymentStatus with recurring as true since agreementId exists', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: '123' } })
    const paymentReference = '15nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockResolvedValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockResolvedValueOnce({
      json: async () => ({ events: [{ state: { status: 'success' }, updated: '2020-06-01T10:35:56.873Z' }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentReference, true)
  })

  it('calls fetchPaymentStatus with recurring as false since agreementId does not exist', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({})
    const paymentReference = '25nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentReference, false)
  })

  it('calls fetchPaymentEvents with recurring as true since agreementId exists', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: '123' } })
    const paymentReference = '35nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z',
        agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockResolvedValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockResolvedValueOnce({
      json: async () => ({ events: [{ state: { status: 'success' }, updated: '2020-06-01T10:35:56.873Z' }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledWith(paymentReference, true)
  })

  it('calls fetchPaymentEvents with recurring as false since agreementId does not exist', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({})
    const paymentReference = '45nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledWith(paymentReference, false)
  })

  it('calls fetchPaymentStatus with recurring as true since agreementId exists', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: '123' } })
    const paymentReference = '15nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockResolvedValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockResolvedValueOnce({
      json: async () => ({ events: [{ state: { status: 'success' }, updated: '2020-06-01T10:35:56.873Z' }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentReference, true)
  })

  it('calls fetchPaymentStatus with recurring as false since agreementId does not exist', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({})
    const paymentReference = '25nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentReference, false)
  })

  it('calls fetchPaymentEvents with recurring as true since agreementId exists', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: '123' } })
    const paymentReference = '35nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z',
        agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockResolvedValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockResolvedValueOnce({
      json: async () => ({ events: [{ state: { status: 'success' }, updated: '2020-06-01T10:35:56.873Z' }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledWith(paymentReference, true)
  })

  it('calls fetchPaymentEvents with recurring as false since agreementId does not exist', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({})
    const paymentReference = '45nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledWith(paymentReference, false)
  })

  it('calls fetchPaymentStatus with recurring as true since agreementId exists', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: '123' } })
    const paymentReference = '15nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [{ state: { status: 'success', updated: '2025-08-08T12:00:00.000Z' } }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentReference, true)
  })

  it('calls fetchPaymentStatus with recurring as false since agreementId does not exist', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({})
    const paymentReference = '25nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [{ state: { status: 'success', updated: '2025-08-08T12:00:00.000Z' } }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentReference, false)
  })

  it('calls fetchPaymentEvents with recurring as true since agreementId exists', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: '123' } })
    const paymentReference = '35nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [{ state: { status: 'success', updated: '2025-08-08T12:00:00.000Z' } }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledWith(paymentReference, true)
  })

  it('calls fetchPaymentEvents with recurring as false since agreementId does not exist', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({})
    const paymentReference = '45nioqikvvnuu5l8m2qeaj0qap'
    const journalEntriesAgreement = [
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ]
    salesApi.paymentJournals.getAll.mockReturnValue(journalEntriesAgreement)
    salesApi.updatePaymentJournal.mockImplementation(jest.fn())
    salesApi.finaliseTransaction.mockImplementation(jest.fn())
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [{ state: { status: 'success', updated: '2025-08-08T12:00:00.000Z' } }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledWith(paymentReference, false)
  })

  describe("When a payment isn't present in GovPay", () => {
    const absentPaymentSetup = () => {
      const sampleJournalEntries = journalEntries()
      const NOT_FOUND_ID = sampleJournalEntries[2].id
      const NOT_FOUND_PAYMENT_REFERENCE = sampleJournalEntries[2].paymentReference

      salesApi.paymentJournals.getAll.mockReturnValue(sampleJournalEntries)
      salesApi.updatePaymentJournal.mockImplementation(() => {})
      salesApi.finaliseTransaction.mockImplementation(() => {})

      govUkPayApi.fetchPaymentEvents.mockImplementation(paymentReference => {
        if (paymentReference === NOT_FOUND_PAYMENT_REFERENCE) {
          return { json: async () => govUkPayStatusNotFound() }
        }
        return { json: async () => createPaymentEventsEntry(govUkPayStatusEntries.find(se => se.payment_id === paymentReference)) }
      })

      govUkPayApi.fetchPaymentStatus.mockImplementation(paymentReference => {
        if (paymentReference === NOT_FOUND_PAYMENT_REFERENCE) {
          return { json: async () => govUkPayStatusNotFound() }
        }
        return { json: async () => govUkPayStatusEntries.find(se => se.payment_id === paymentReference) }
      })

      return {
        sampleJournalEntries,
        NOT_FOUND_ID
      }
    }

    it('no error is thrown', async () => {
      absentPaymentSetup()
      await expect(execute(1, 1)).resolves.toBeUndefined()
    })

    it('other results process', async () => {
      const { NOT_FOUND_ID, sampleJournalEntries } = absentPaymentSetup()

      await execute(1, 1)

      const foundIds = sampleJournalEntries.map(j => j.id).filter(id => id !== NOT_FOUND_ID)
      for (const foundId of foundIds) {
        expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(foundId, expect.any(Object))
      }
    })

    it("it's marked as expired after 3 hours", async () => {
      const { NOT_FOUND_ID, sampleJournalEntries } = absentPaymentSetup()
      const missingJournalEntry = sampleJournalEntries.find(je => je.id === NOT_FOUND_ID)
      missingJournalEntry.paymentTimestamp = moment().subtract(3, 'hours').toISOString()

      await execute(1, 1)

      expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(
        NOT_FOUND_ID,
        expect.objectContaining({
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Expired
        })
      )
    })

    it("it's not marked as expired if 3 hours haven't passed", async () => {
      const { NOT_FOUND_ID, sampleJournalEntries } = absentPaymentSetup()
      const missingJournalEntry = sampleJournalEntries.find(je => je.id === NOT_FOUND_ID)
      missingJournalEntry.paymentTimestamp = moment().subtract(2, 'hours').toISOString()

      await execute(1, 1)

      expect(salesApi.updatePaymentJournal).not.toHaveBeenCalledWith(
        NOT_FOUND_ID,
        expect.objectContaining({
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Expired
        })
      )
    })

    it('cancels the recurring payment when being marked as expired', async () => {
      const { NOT_FOUND_ID, sampleJournalEntries } = absentPaymentSetup()
      const rpid = Symbol('rp-id')
      salesApi.retrieveStagedTransaction.mockImplementation(pjid => {
        if (pjid === NOT_FOUND_ID) {
          return {
            paymentTimestamp: moment().subtract(3, 'hours'),
            recurringPayment: { agreementId: 'abc-123', id: rpid }
          }
        }
      })
      const missingJournalEntry = sampleJournalEntries.find(je => je.id === NOT_FOUND_ID)
      missingJournalEntry.paymentTimestamp = moment().subtract(3, 'hours').toISOString()

      await execute(1, 1)

      expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith(rpid)
    })

    it("doesn't call cancel for payments without a recurring payment", async () => {
      const { NOT_FOUND_ID, sampleJournalEntries } = absentPaymentSetup()
      salesApi.retrieveStagedTransaction.mockImplementation(pjid => {
        if (pjid === NOT_FOUND_ID) {
          return {
            paymentTimestamp: moment().subtract(3, 'hours'),
            recurringPayment: { agreementId: 'abc-123', id: 'def-456' }
          }
        }
      })
      const missingJournalEntry = sampleJournalEntries.find(je => je.id === NOT_FOUND_ID)
      missingJournalEntry.paymentTimestamp = moment().subtract(3, 'hours').toISOString()

      await execute(1, 1)

      expect(salesApi.cancelRecurringPayment).toHaveBeenCalledTimes(1)
    })
  })

  describe('Recurring Payment is cancelled when', () => {
    it.each([
      ['expired', GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED],
      ['user_cancelled', GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED],
      ['rejected', GOVUK_PAY_ERROR_STATUS_CODES.REJECTED]
    ])('payment status code is %s', async (_d, paymentStatus) => {
      const id = Symbol('rp-id')
      salesApi.paymentJournals.getAll.mockReturnValueOnce([journalEntries()[0]])
      salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: 'abc-123', id } })
      govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
        json: async () => ({ state: { code: paymentStatus } })
      })

      await execute(1, 1)

      expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith(id)
    })
  })
})
