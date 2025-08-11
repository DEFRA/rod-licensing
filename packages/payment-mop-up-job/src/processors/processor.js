import { salesApi, govUkPayApi } from '@defra-fish/connectors-lib'
import {
  GOVUK_PAY_ERROR_STATUS_CODES,
  PAYMENT_JOURNAL_STATUS_CODES,
  TRANSACTION_SOURCE,
  PAYMENT_TYPE
} from '@defra-fish/business-rules-lib'
import Bottleneck from 'bottleneck'
import moment from 'moment'
import db from 'debug'
import { RATE_LIMIT_MS_DEFAULT, CONCURRENCY_DEFAULT } from '../constants.js'
const debug = db('payment-mop-up-job:execute')

const MISSING_PAYMENT_EXPIRY_TIMEOUT = 3 // number of hours to wait before marking a missing payment as expired

const limiter = new Bottleneck({
  minTime: process.env.RATE_LIMIT_MS || RATE_LIMIT_MS_DEFAULT,
  maxConcurrent: process.env.CONCURRENCY || CONCURRENCY_DEFAULT
})

const getPaymentJournalStatusCodeFromGovPayErrorStatusCode = govPayErrorStatusCode => {
  switch (govPayErrorStatusCode) {
    case GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED:
    case GOVUK_PAY_ERROR_STATUS_CODES.NOT_FOUND:
      return PAYMENT_JOURNAL_STATUS_CODES.Expired
    case GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED:
      return PAYMENT_JOURNAL_STATUS_CODES.Cancelled
    case GOVUK_PAY_ERROR_STATUS_CODES.REJECTED:
      return PAYMENT_JOURNAL_STATUS_CODES.Failed
  }
}

const shouldUpdatePaymentJournal = transaction => {
  const { code, state } = transaction.paymentStatus
  const { paymentTimestamp } = transaction

  const isExpiredCancelledOrRejected = [
    GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED,
    GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED,
    GOVUK_PAY_ERROR_STATUS_CODES.REJECTED
  ].includes(state?.code)

  const isExpiredNotFound =
    code === GOVUK_PAY_ERROR_STATUS_CODES.NOT_FOUND && moment().diff(moment(paymentTimestamp), 'hours') >= MISSING_PAYMENT_EXPIRY_TIMEOUT

  return isExpiredCancelledOrRejected || isExpiredNotFound
}

const processPaymentResults = async transaction => {
  if (transaction.paymentStatus.state?.status === 'error') {
    await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
  }

  if (transaction.paymentStatus.state?.status === 'success') {
    debug(`Completing mop up finalization for transaction id: ${transaction.id}`)
    await salesApi.finaliseTransaction(transaction.id, {
      payment: {
        amount: transaction.paymentStatus.amount / 100,
        timestamp: transaction.paymentStatus.transactionTimestamp,
        source: TRANSACTION_SOURCE.govPay,
        method: PAYMENT_TYPE.debit
      }
    })
    await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed })
  } else if (shouldUpdatePaymentJournal(transaction)) {
    await salesApi.updatePaymentJournal(transaction.id, {
      paymentStatus: getPaymentJournalStatusCodeFromGovPayErrorStatusCode(
        transaction.paymentStatus.state?.code || transaction.paymentStatus.code
      )
    })
    if (transaction.recurringPaymentId) {
      await salesApi.cancelRecurringPayment(transaction.recurringPaymentId)
    }
  }
}

const getStatus = async (paymentReference, agreementId) => {
  const recurring = !!agreementId
  const paymentStatusResponse = await govUkPayApi.fetchPaymentStatus(paymentReference, recurring)
  const paymentStatus = await paymentStatusResponse.json()
  if (paymentStatus.state?.status === 'success') {
    const eventsResponse = await govUkPayApi.fetchPaymentEvents(paymentReference, recurring)
    const { events } = await eventsResponse.json()
    paymentStatus.transactionTimestamp = events.find(e => e.state.status === 'success')?.updated
  }
  return paymentStatus
}

const getStatusWrapped = limiter.wrap(getStatus)

export const execute = async (ageMinutes, scanDurationHours) => {
  debug(`Running payment mop up processor with a payment age of ${ageMinutes} minutes and a scan duration of ${scanDurationHours} hours`)

  const toTimestamp = moment().add(-1 * ageMinutes, 'minutes')
  const fromTimestamp = toTimestamp.clone().add(-1 * scanDurationHours, 'hours')

  const paymentJournals = await salesApi.paymentJournals.getAll({
    paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress,
    from: fromTimestamp.toISOString(),
    to: toTimestamp.toISOString()
  })

  // Get the status for each payment from the GOV.UK Pay API.
  const journalsWithRecurringPaymentIDs = await Promise.all(
    paymentJournals.map(async p => {
      const transactionRecord = await salesApi.retrieveStagedTransaction(p.id)
      const paymentJournalWithStatus = {
        ...p,
        paymentStatus: await getStatusWrapped(p.paymentReference, transactionRecord?.recurringPayment?.agreementId)
      }
      if (transactionRecord?.recurringPayment) {
        paymentJournalWithStatus.recurringPaymentId = transactionRecord.recurringPayment.id
      }
      return paymentJournalWithStatus
    })
  )

  // Process each result
  await Promise.all(journalsWithRecurringPaymentIDs.map(async j => processPaymentResults(j)))
}
