import { salesApi, govUkPayApi } from '@defra-fish/connectors-lib'
import { execute } from '../processor.js'
import { GOVUK_PAY_ERROR_STATUS_CODES, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'

jest.mock('@defra-fish/connectors-lib')

const journalEntries = [
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

const govUkPayEntries = [
  {
    payment_id: '05nioqikvvnuu5l8m2qeaj0qap',
    state: {
      status: 'success',
      finished: true
    }
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
    payment_id: '7lufvi9sbh077rvrrmnqo63vme',
    state: {
      code: GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED,
      status: 'cancelled',
      finished: true
    }
  },
  {
    payment_id: '7lufvi9sbh077rvrrmnqo63vme',
    state: {
      code: GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED,
      status: 'failed',
      finished: false
    }
  }
]

describe('processor', () => {
  beforeEach(jest.clearAllMocks)

  it('completes normally where there are no journal records retrieved', async () => {
    salesApi.paymentJournals.getAll = jest.fn(async () => [])
    govUkPayApi.fetchPaymentStatus = jest.fn()
    await execute(1, 1)
    expect(govUkPayApi.fetchPaymentStatus).not.toHaveBeenCalled()
  })

  it('completes normally where there are journal records retrieved', async () => {
    salesApi.paymentJournals.getAll = jest.fn(async () => journalEntries)
    salesApi.updatePaymentJournal = jest.fn()
    govUkPayApi.fetchPaymentStatus = jest
      .fn()
      .mockImplementationOnce(async () => ({ json: async () => govUkPayEntries[0] }))
      .mockImplementationOnce(async () => ({ json: async () => govUkPayEntries[1] }))
      .mockImplementationOnce(async () => ({ json: async () => govUkPayEntries[2] }))
      .mockImplementationOnce(async () => ({ json: async () => govUkPayEntries[3] }))
      .mockImplementationOnce(async () => ({ json: async () => govUkPayEntries[4] }))
    await execute(1, 1)
    expect(govUkPayApi.fetchPaymentStatus).toHaveBeenCalled()
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
})
