import { salesApi } from '@defra-fish/connectors-lib'
import {
  GOVUK_PAY_ERROR_STATUS_CODES,
  PAYMENT_JOURNAL_STATUS_CODES, TRANSACTION_SOURCE, PAYMENT_TYPE
} from '@defra-fish/business-rules-lib'
import fetch from 'node-fetch'
import moment from 'moment'
import db from 'debug'
const debug = db('payment-mop-up-job:execute')

const getGovUkPaymentStatus = async id => {
  debug(`Get payment status for payment id: ${id}`)
  let response
  try {
    response = await fetch(`${process.env.GOV_PAY_API_URL}/${id}`, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${process.env.GOV_PAY_APIKEY}`,
        'content-type': 'application/json'
      },
      method: 'get',
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || 10000
    })
  } catch (err) {
    console.error(`Error retrieving the payment status from the GOV.UK API service - payment id: ${id}`, err)
    throw err
  }

  if (response.ok) {
    const res = await response.json()
    debug('Payment status response: %O', res)
    return res
  } else {
    const resMsg = {
      status: response.status,
      response: await response.json()
    }
    console.error(`Error retrieving the payment status from the GOV.UK API service - payment id: ${id}`, resMsg)
    throw new Error()
  }
}

const processPaymentResults = async transaction => {
  if (transaction.paymentStatus.state.status === 'error') {
    await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
  }

  if (transaction.paymentStatus.state.status === 'success') {
    debug(`Completing mop up finalization for transaction id: ${transaction.id}`)
    await salesApi.finaliseTransaction(transaction.id, {
      payment: {
        amount: transaction.paymentStatus.amount / 100,
        timestamp: moment().toISOString(),
        source: TRANSACTION_SOURCE.govPay,
        method: PAYMENT_TYPE.debit
      }
    })
    await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Completed })
  } else {
    // The payment expired
    if (transaction.paymentStatus.state.code === GOVUK_PAY_ERROR_STATUS_CODES.EXPIRED) {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
    }

    // The user cancelled the payment
    if (transaction.paymentStatus.state.code === GOVUK_PAY_ERROR_STATUS_CODES.USER_CANCELLED) {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Cancelled })
    }

    // The payment was rejected
    if (transaction.paymentStatus.state.code === GOVUK_PAY_ERROR_STATUS_CODES.REJECTED) {
      await salesApi.updatePaymentJournal(transaction.id, { paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed })
    }
  }
}

export const execute = async (ageMinutes, scanDurationHours) => {
  debug(`Running payment mop up processor with a payment age of ${ageMinutes} minutes ` +
    `and a scan duration of ${scanDurationHours} hours`)

  const toTimestamp = moment().add(-1 * ageMinutes, 'minutes')
  const fromTimestamp = toTimestamp.clone().add(-1 * scanDurationHours, 'hours')

  console.log(`Scanning the payment journal for payments created between ${fromTimestamp} and ${toTimestamp}`)

  const paymentJournals = await salesApi.paymentJournals.getAll({
    paymentStatus: 'In Progress',
    from: fromTimestamp.toISOString(),
    to: toTimestamp.toISOString()
  })

  // Get the status for each payment from the GOV.UK Pay API.
  const transactions = await Promise.all(paymentJournals.map(async p => ({
    ...p, paymentStatus: await getGovUkPaymentStatus(p.paymentReference)
  })))

  // Process each result
  await Promise.all(transactions.map(async t => processPaymentResults(t)))
}
