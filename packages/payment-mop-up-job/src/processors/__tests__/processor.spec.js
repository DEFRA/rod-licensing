import { salesApi, govUkPayApi } from '@defra-fish/connectors-lib'
import { execute } from '../processor.js'
import { GOVUK_PAY_ERROR_STATUS_CODES, PAYMENT_JOURNAL_STATUS_CODES, PAYMENT_STATUS } from '@defra-fish/business-rules-lib'
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
    eligibleForEarlyMopUp: false,
    paymentStatus: 'In Progress',
    paymentReference: '05nioqikvvnuu5l8m2qeaj0qap',
    paymentTimestamp: '2020-06-01T10:35:56.873Z',
    permissions: [
      {
        referenceNumber: '23271027-2WC3FSG-AFPDA8',
        licensee: {
          firstName: 'Spooky',
          lastName: 'Ghost'
        }
      }
    ],
    data: {
      cost: 36.8,
      dataSource: 'Web Sales',
      id: 'd367bd08-7c5c-45b6-8581-f60225d59492'
    }
  },
  {
    id: 'aaced854-d337-47ee-8d5e-75b26aeb90fb',
    eligibleForEarlyMopUp: false,
    paymentStatus: 'In Progress',
    paymentReference: '0f3dr9ugp7u68qq18vt9h8ma85',
    paymentTimestamp: '2020-06-02T07:17:23.169Z',
    permissions: [
      {
        referenceNumber: '23271028-3XD4GRH-BGQEB9',
        licensee: {
          firstName: 'John',
          lastName: 'Smith'
        }
      }
    ],
    data: {
      cost: 45.5,
      dataSource: 'Phone Sales',
      id: 'e478ce19-8d6d-56c7-9692-g71336d60603'
    }
  },
  {
    id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8213',
    eligibleForEarlyMopUp: false,
    paymentStatus: 'In Progress',
    paymentReference: '7lufvi9sbh077rvrrmnqo63vme',
    paymentTimestamp: '2020-06-04T11:04:30.802Z',
    permissions: [
      {
        referenceNumber: '23271029-4YE5HSI-CHRFC0',
        licensee: {
          firstName: 'Jane',
          lastName: 'Doe'
        }
      }
    ],
    data: {
      cost: 52.25,
      dataSource: 'Web Sales',
      id: 'f589df2a-9e7e-67d8-0803-h82447e71714'
    }
  },
  {
    id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8214',
    eligibleForEarlyMopUp: true,
    paymentStatus: 'In Progress',
    paymentReference: '7lufvi9sbh077rvrrmnqo63vmf',
    paymentTimestamp: '2020-06-04T12:04:30.802Z',
    permissions: [
      {
        referenceNumber: '23271030-5ZF6ITJ-DISSGD1',
        licensee: {
          firstName: 'Bob',
          lastName: 'Johnson'
        }
      }
    ],
    data: {
      cost: 28.9,
      dataSource: 'Post Office',
      id: 'g69aeg3b-0f8f-78e9-1914-i93558f82825'
    }
  },
  {
    id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8215',
    eligibleForEarlyMopUp: false,
    paymentStatus: 'In Progress',
    paymentReference: '7lufvi9sbh077rvrrmnqo63vmg',
    paymentTimestamp: '2020-06-04T12:04:30.802Z',
    permissions: [
      {
        referenceNumber: '23271031-6AG7JUK-EJUTAHE2',
        licensee: {
          firstName: 'Alice',
          lastName: 'Williams'
        }
      }
    ],
    data: {
      cost: 19.75,
      dataSource: 'Web Sales',
      id: 'h7aabfh4c-1g9g-89fa-2a25-j04669g93936'
    }
  }
]

const govUkPayStatusEntries = () => [
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

const mockSingleSuccessfulPayment = () => {
  const [entry] = journalEntries()
  const [status] = govUkPayStatusEntries()
  salesApi.paymentJournals.getAll.mockReturnValueOnce([entry])
  govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({ json: async () => status })
  govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({ json: async () => createPaymentEventsEntry(status) })
  return entry
}

describe('processor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    govUkPayApi.fetchPaymentStatus.mockReset()
    govUkPayApi.fetchPaymentEvents.mockReset()
  })

  beforeAll(() => {
    salesApi.paymentJournals.getAll.mockReturnValue([])
  })

  it('completes normally where there are no journal records retrieved', async () => {
    salesApi.paymentJournals.getAll.mockReturnValueOnce([])
    await execute(1, 1)
    expect(govUkPayApi.fetchPaymentStatus).not.toHaveBeenCalled()
  })

  it('completes normally where there are journal records retrieved', async () => {
    salesApi.paymentJournals.getAll.mockReturnValueOnce(journalEntries())
    const payStatusEntries = govUkPayStatusEntries()
    payStatusEntries.forEach(status => {
      govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({ json: async () => status })
      govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({ json: async () => createPaymentEventsEntry(status) })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledTimes(payStatusEntries.length)
    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledTimes(payStatusEntries.filter(s => s.state.status === 'success').length)
    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(payStatusEntries.filter(s => s.state.status === 'success').length)
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

  it('treats a 410 error code from finaliseTransaction as already finalised and continues processing', async () => {
    const entry = mockSingleSuccessfulPayment()
    salesApi.finaliseTransaction.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    expect(salesApi.updatePaymentJournal).toHaveBeenCalledWith(entry.id, {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed
    })
  })

  it('logs a debug message when a 410 error code from finaliseTransaction is treated as already finalised', async () => {
    const entry = mockSingleSuccessfulPayment()
    salesApi.finaliseTransaction.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    expect(console.log).toHaveBeenCalledWith(
      `[payment-mop-up-job] Transaction id: ${entry.id} has already been finalised (410 Gone) [cost: 36.8, dataSource: Web Sales, id: d367bd08-7c5c-45b6-8581-f60225d59492]`
    )
  })

  it('rethrows errors from finaliseTransaction that are not a 410 error', async () => {
    mockSingleSuccessfulPayment()
    salesApi.finaliseTransaction.mockRejectedValueOnce(Object.assign(new Error('Server error'), { status: 500 }))

    await expect(execute(1, 1)).rejects.toThrow('Server error')
  })

  it.each([
    ['2026-09-10T09:00:00.000Z', 1, 1],
    ['2024-02-29T19:00:00.000Z', 14, 5],
    ['2026-09-10T00:01:00.000Z', 28, 37]
  ])(
    "sends expected arguments to query payment journals when it's %s, we're looking for payments over %i minute(s) old and going back %i hour(s)",
    async (now, ageMinutes, scanDurationHours) => {
      jest.useFakeTimers().setSystemTime(new Date(now))
      const expectedFrom = moment(now).subtract({ minutes: ageMinutes, hours: scanDurationHours }).toISOString()

      await execute(ageMinutes, scanDurationHours)

      expect(salesApi.paymentJournals.getAll).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress,
          from: expectedFrom,
          to: now
        })
      )
      jest.useRealTimers()
    }
  )

  it('only processes payments that are either within the payment window or have eligibleForEarlyMopUp flag', async () => {
    const now = '2020-06-04T12:04:30.802Z'
    jest.useFakeTimers().setSystemTime(new Date(now))
    const sampleJournalEntries = journalEntries()
    salesApi.paymentJournals.getAll.mockResolvedValueOnce(sampleJournalEntries)
    for (let x = 0; x < sampleJournalEntries.length; x++) {
      govUkPayApi.fetchPaymentStatus.mockImplementationOnce(ref => ({ json: async () => ({}) }))
      govUkPayApi.fetchPaymentEvents.mockImplementationOnce(ref => ({
        json: async () => ({
          events: [
            {
              payment_id: ref,
              state: {
                status: 'success',
                finished: true
              },
              amount: 8200
            }
          ]
        })
      }))
    }

    await execute(1, 1)

    const expectedIds = [
      '05nioqikvvnuu5l8m2qeaj0qap',
      '0f3dr9ugp7u68qq18vt9h8ma85',
      '7lufvi9sbh077rvrrmnqo63vme',
      '7lufvi9sbh077rvrrmnqo63vmf'
    ]
    const unexpectedId = '7lufvi9sbh077rvrrmnqo63vmg'
    for (const expectedId of expectedIds) {
      expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(expectedId, expect.anything())
    }
    expect(govUkPayApi.fetchPaymentStatus).not.toHaveBeenCalledWith(unexpectedId, expect.anything())

    jest.useRealTimers()
  })

  it('calls fetchPaymentStatus with recurring as true since agreementId exists', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: '123' } })
    const paymentReference = '15nioqikvvnuu5l8m2qeaj0qap'
    salesApi.paymentJournals.getAll.mockReturnValueOnce([
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ])
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
    const paymentReference = '25nioqikvvnuu5l8m2qeaj0qap'
    salesApi.paymentJournals.getAll.mockReturnValueOnce([
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ])
    govUkPayApi.fetchPaymentEvents.mockResolvedValueOnce({
      json: async () => ({ events: [{ state: { status: 'success', updated: '2026-10-27T00:00:00.000Z' } }] })
    })
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalledWith(paymentReference, false)
  })

  it('calls fetchPaymentEvents with recurring as true since agreementId exists', async () => {
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: '123' } })
    const paymentReference = '35nioqikvvnuu5l8m2qeaj0qap'
    salesApi.paymentJournals.getAll.mockReturnValueOnce([
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z',
        agreementId: 'c9267c6e-573d-488b-99ab-ea18431fc472'
      }
    ])
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
    const paymentReference = '45nioqikvvnuu5l8m2qeaj0qap'
    salesApi.paymentJournals.getAll.mockReturnValueOnce([
      {
        id: 'a0e0e5c3-1004-4271-80ba-d05eda3e8220',
        paymentStatus: 'In Progress',
        paymentReference,
        paymentTimestamp: '2020-06-01T10:35:56.873Z'
      }
    ])
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [{ state: { status: 'success' } }] })
    })

    await execute(1, 1)

    expect(govUkPayApi.fetchPaymentEvents).toHaveBeenCalledWith(paymentReference, false)
  })

  describe("When a payment isn't present in GovPay", () => {
    const absentPaymentSetup = () => {
      const sampleJournalEntries = journalEntries()
      const NOT_FOUND_ID = sampleJournalEntries[2].id
      const NOT_FOUND_PAYMENT_REFERENCE = sampleJournalEntries[2].paymentReference
      const payStatusEntries = govUkPayStatusEntries()

      salesApi.paymentJournals.getAll.mockReturnValueOnce(sampleJournalEntries)

      govUkPayApi.fetchPaymentEvents.mockImplementationOnce(paymentReference => {
        if (paymentReference === NOT_FOUND_PAYMENT_REFERENCE) {
          return { json: async () => govUkPayStatusNotFound() }
        }
        return { json: async () => createPaymentEventsEntry(payStatusEntries.find(se => se.payment_id === paymentReference)) }
      })

      govUkPayApi.fetchPaymentStatus.mockImplementation(paymentReference => {
        if (paymentReference === NOT_FOUND_PAYMENT_REFERENCE) {
          return { json: async () => govUkPayStatusNotFound() }
        }
        return { json: async () => payStatusEntries.find(se => se.payment_id === paymentReference) }
      })

      return {
        sampleJournalEntries,
        NOT_FOUND_ID
      }
    }
    afterEach(() => govUkPayApi.fetchPaymentStatus.mockClear())

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
      salesApi.retrieveStagedTransaction.mockClear()
    })

    it("doesn't call cancel for payments without a recurring payment", async () => {
      const { NOT_FOUND_ID, sampleJournalEntries } = absentPaymentSetup()
      salesApi.retrieveStagedTransaction.mockImplementationOnce(pjid => {
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
    it('payment has an error status', async () => {
      const id = Symbol('rp-id')
      salesApi.paymentJournals.getAll.mockReturnValueOnce([journalEntries()[0]])
      salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: 'abc-123', id } })
      govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
        json: async () => ({ state: { status: PAYMENT_STATUS.Error } })
      })

      await execute(1, 1)

      expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith(id)
    })

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

  it("doesn't cancel Recurring Payment if payment succeeded", async () => {
    salesApi.paymentJournals.getAll.mockReturnValueOnce([journalEntries()[0]])
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: 'abc-123', id: 'def-456' } })
    govUkPayApi.fetchPaymentEvents.mockResolvedValueOnce({
      json: async () => ({ events: [{ state: { status: 'success', updated: '2026-10-27T00:00:00.000Z' } }] })
    })
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' } })
    })

    await execute(1, 1)

    expect(salesApi.cancelRecurringPayment).not.toHaveBeenCalled()
  })

  it('When an error is encountered in salesApi.finalise transaction, other payments are still mopped up', async () => {
    const journals = journalEntries()
    salesApi.paymentJournals.getAll.mockReturnValueOnce(journals)
    for (let x = 0; x < journals.length; x++) {
      govUkPayApi.fetchPaymentStatus.mockResolvedValueOnce({ json: async () => ({ state: { status: 'success' } }) })
      govUkPayApi.fetchPaymentEvents.mockResolvedValueOnce({
        json: async () => ({ events: [{ state: { status: 'success', updated: '2026-10-27T00:00:00.000Z' } }] })
      })
    }
    salesApi.finaliseTransaction.mockRejectedValueOnce(
      Object.assign(new Error('Unexpected response from the Sales API: { "ok": false, "status": 410, "statusText": "Gone" }'), {
        status: 410
      })
    )

    await execute(1, 1)

    expect(salesApi.finaliseTransaction).toHaveBeenCalledTimes(5)
  })

  it('treats a 410 error code from updatePaymentJournal as already updated and continues processing', async () => {
    mockSingleSuccessfulPayment()
    salesApi.updatePaymentJournal.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    expect(salesApi.cancelRecurringPayment).not.toHaveBeenCalled()
  })

  it('logs a debug message when a 410 error code from updatePaymentJournal is treated as already updated', async () => {
    const entry = mockSingleSuccessfulPayment()
    salesApi.updatePaymentJournal.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    expect(console.log).toHaveBeenCalledWith(
      `[payment-mop-up-job] Transaction id: ${entry.id} journal already updated (410 Gone) [cost: 36.8, dataSource: Web Sales, id: d367bd08-7c5c-45b6-8581-f60225d59492]`
    )
  })

  it('rethrows errors from updatePaymentJournal that are not a 410 error', async () => {
    mockSingleSuccessfulPayment()
    salesApi.updatePaymentJournal.mockRejectedValueOnce(Object.assign(new Error('Database error'), { status: 500 }))

    await expect(execute(1, 1)).rejects.toThrow('Database error')
  })

  it('treats a 410 error code from cancelRecurringPayment as already cancelled and continues processing', async () => {
    const entry = journalEntries()[0]
    const rpid = Symbol('recurring-payment-id')
    salesApi.paymentJournals.getAll.mockReturnValueOnce([entry])
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: 'abc-123', id: rpid } })
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: PAYMENT_STATUS.Error } })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [] })
    })
    salesApi.cancelRecurringPayment.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    expect(salesApi.cancelRecurringPayment).toHaveBeenCalledWith(rpid)
  })

  it('logs a debug message when a 410 error code from cancelRecurringPayment is treated as already cancelled', async () => {
    const entry = journalEntries()[0]
    const rpid = Symbol('recurring-payment-id')
    salesApi.paymentJournals.getAll.mockReturnValueOnce([entry])
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: 'abc-123', id: rpid } })
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: PAYMENT_STATUS.Error } })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [] })
    })
    salesApi.cancelRecurringPayment.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    expect(console.log).toHaveBeenCalledWith(
      `[payment-mop-up-job] Transaction id: ${entry.id} recurring payment already cancelled (410 Gone) [cost: 36.8, dataSource: Web Sales, id: d367bd08-7c5c-45b6-8581-f60225d59492]`
    )
  })

  it('rethrows errors from cancelRecurringPayment that are not a 410 error', async () => {
    const entry = journalEntries()[0]
    const rpid = Symbol('recurring-payment-id')
    salesApi.paymentJournals.getAll.mockReturnValueOnce([entry])
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: { agreementId: 'abc-123', id: rpid } })
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: PAYMENT_STATUS.Error } })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [] })
    })
    salesApi.cancelRecurringPayment.mockRejectedValueOnce(Object.assign(new Error('API error'), { status: 500 }))

    await expect(execute(1, 1)).rejects.toThrow('API error')
  })

  it('treats a 410 error code from retrieveStagedTransaction as already retrieved and returns empty array', async () => {
    const entry = journalEntries()[0]
    salesApi.paymentJournals.getAll.mockReturnValueOnce([entry])
    salesApi.retrieveStagedTransaction.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    expect(salesApi.updatePaymentJournal).not.toHaveBeenCalled()
  })

  it('logs a debug message when a 410 error code from retrieveStagedTransaction is treated as already retrieved', async () => {
    const entry = journalEntries()[0]
    salesApi.paymentJournals.getAll.mockReturnValueOnce([entry])
    salesApi.retrieveStagedTransaction.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    expect(console.log).toHaveBeenCalledWith(
      `[payment-mop-up-job] Cannot retrieve transaction id: ${entry.id} (410 Gone) [cost: 36.8, dataSource: Web Sales, id: d367bd08-7c5c-45b6-8581-f60225d59492]`
    )
  })

  it('rethrows non-410 errors from retrieveStagedTransaction', async () => {
    const entry = journalEntries()[0]
    salesApi.paymentJournals.getAll.mockReturnValueOnce([entry])
    salesApi.retrieveStagedTransaction.mockRejectedValueOnce(Object.assign(new Error('Retrieval error'), { status: 500 }))

    await expect(execute(1, 1)).rejects.toThrow('Retrieval error')
  })

  it('logs multiple 410 errors from retrieveStagedTransaction separately with transaction details', async () => {
    const entries = journalEntries().slice(0, 2)
    salesApi.paymentJournals.getAll.mockReturnValueOnce(entries)
    salesApi.retrieveStagedTransaction.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))
    salesApi.retrieveStagedTransaction.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))

    await execute(1, 1)

    const retrievalLogs = console.log.mock.calls.filter(call => call[0].includes('Cannot retrieve'))
    expect(retrievalLogs).toEqual([
      [
        `[payment-mop-up-job] Cannot retrieve transaction id: ${entries[0].id} (410 Gone) [cost: 36.8, dataSource: Web Sales, id: d367bd08-7c5c-45b6-8581-f60225d59492]`
      ],
      [
        `[payment-mop-up-job] Cannot retrieve transaction id: ${entries[1].id} (410 Gone) [cost: 45.5, dataSource: Phone Sales, id: e478ce19-8d6d-56c7-9692-g71336d60603]`
      ]
    ])
  })

  it('skips 410 transactions but continues processing successful ones in the same batch', async () => {
    const entries = journalEntries().slice(0, 2)
    salesApi.paymentJournals.getAll.mockReturnValueOnce(entries)
    salesApi.retrieveStagedTransaction.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))
    salesApi.retrieveStagedTransaction.mockReturnValueOnce({ recurringPayment: null })
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => govUkPayStatusEntries()[0]
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => createPaymentEventsEntry(govUkPayStatusEntries()[0])
    })

    await execute(1, 1)

    expect(salesApi.updatePaymentJournal.mock.calls).toEqual([[entries[1].id, expect.any(Object)]])
  })

  it('logs 410 error without transaction data details when data field is missing', async () => {
    const entry = journalEntries()[0]
    const entryWithoutData = { ...entry, data: null }
    salesApi.paymentJournals.getAll.mockReturnValueOnce([entryWithoutData])
    salesApi.finaliseTransaction.mockRejectedValueOnce(Object.assign(new Error('Gone'), { status: 410 }))
    govUkPayApi.fetchPaymentStatus.mockReturnValueOnce({
      json: async () => ({ state: { status: 'success' }, amount: 8200 })
    })
    govUkPayApi.fetchPaymentEvents.mockReturnValueOnce({
      json: async () => ({ events: [{ state: { status: 'success' }, updated: 'FINAL_PAYMENT_EVENT_TIMESTAMP' }] })
    })

    await execute(1, 1)

    expect(console.log).toHaveBeenCalledWith(
      `[payment-mop-up-job] Transaction id: ${entry.id} has already been finalised (410 Gone)`
    )
  })
})
