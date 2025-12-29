import moment from 'moment-timezone'
import { PAYMENT_STATUS, SERVICE_LOCAL_TIME, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { salesApi, airbrake } from '@defra-fish/connectors-lib'
import { getPaymentStatus, sendPayment, isGovPayUp } from './services/govuk-pay-service.js'
import db from 'debug'

const debug = db('recurring-payments:processor')

const SIGINT_CODE = 130
const SIGTERM_CODE = 137
const PAYMENT_STATUS_DELAY = 60000
const MIN_CLIENT_ERROR = 400
const MAX_CLIENT_ERROR = 499
const MIN_SERVER_ERROR = 500
const MAX_SERVER_ERROR = 599

const isClientError = code => code >= MIN_CLIENT_ERROR && code <= MAX_CLIENT_ERROR
const isServerError = code => code >= MIN_SERVER_ERROR && code <= MAX_SERVER_ERROR

export const execute = async () => {
  airbrake.initialise()
  try {
    await processRecurringPayments()
  } catch (e) {
    console.error(e)
  } finally {
    await airbrake.flush()
  }
}

const processRecurringPayments = async () => {
  if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() !== 'true') {
    debug('Recurring Payments job disabled')
    return
  }

  if (!(await isGovPayUp())) {
    debug('Gov.UK Pay reporting unhealthy, aborting run')
    throw new Error('Run aborted, Gov.UK Pay health endpoint is reporting problems.')
  }

  debug('Recurring Payments job enabled')
  const date = new Date().toISOString().split('T')[0]

  const dueRCPayments = await fetchDueRecurringPayments(date)
  if (dueRCPayments.length === 0) {
    return
  }

  const payments = await requestPayments(dueRCPayments)

  await new Promise(resolve => setTimeout(resolve, PAYMENT_STATUS_DELAY))

  await Promise.allSettled(payments.map(p => processRecurringPaymentStatus(p)))
}

const fetchDueRecurringPayments = async date => {
  try {
    const duePayments = await salesApi.getDueRecurringPayments(date)
    debug('Recurring Payments found:', duePayments)
    return duePayments
  } catch (error) {
    console.error('Run aborted. Error fetching due recurring payments:', error)
    throw error
  }
}

const requestPayments = async dueRCPayments => {
  const paymentRequestResults = await Promise.allSettled(dueRCPayments.map(processRecurringPayment))
  const payments = paymentRequestResults.filter(prr => prr.status === 'fulfilled').map(p => p.value)
  const failures = paymentRequestResults.filter(prr => prr.status === 'rejected').map(f => f.reason)
  if (failures.length) {
    console.error('Error requesting payments:', ...failures)
  }
  return payments
}

const processRecurringPayment = async record => {
  const referenceNumber = record.expanded.activePermission.entity.referenceNumber
  const { agreementId, id } = record.entity
  const transaction = await createNewTransaction(referenceNumber, { agreementId, id })
  return takeRecurringPayment(agreementId, transaction)
}

const createNewTransaction = async (referenceNumber, recurringPayment) => {
  const transactionData = await processPermissionData(referenceNumber, recurringPayment)
  return salesApi.createTransaction(transactionData)
}

const takeRecurringPayment = async (agreementId, transaction) => {
  const preparedPayment = preparePayment(agreementId, transaction)
  try {
    const payment = await sendPayment(preparedPayment)
    await salesApi.createPaymentJournal(transaction.id, {
      paymentReference: payment.payment_id,
      paymentTimestamp: payment.created_date,
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
    })

    return {
      agreementId,
      paymentId: payment.payment_id,
      created_date: payment.created_date,
      transaction
    }
  } catch (error) {
    if (error.message.includes('Invalid attribute value: agreement_id. Agreement does not exist')) {
      console.log('%s is an invalid agreementId. Recurring payment %s will be cancelled', agreementId, transaction.recurringPayment.id)
      await salesApi.cancelRecurringPayment(transaction.recurringPayment.id)
    }
    throw error
  }
}

const processPermissionData = async (referenceNumber, recurringPayment) => {
  const data = await salesApi.preparePermissionDataForRenewal(referenceNumber)
  const licenseeWithoutCountryCode = Object.assign((({ countryCode: _countryCode, ...l }) => l)(data.licensee))
  return {
    dataSource: 'Recurring Payment',
    recurringPayment,
    permissions: [
      {
        isLicenceForYou: data.isLicenceForYou,
        isRenewal: data.isRenewal,
        issueDate: null,
        licensee: licenseeWithoutCountryCode,
        permitId: data.permitId,
        startDate: prepareStartDate(data),
        concessions: data.concessions?.map(({ name: _name, ...c }) => ({
          ...c
        }))
      }
    ]
  }
}

const prepareStartDate = permission => {
  return moment
    .tz(permission.licenceStartDate, 'YYYY-MM-DD', SERVICE_LOCAL_TIME)
    .add(permission.licenceStartTime ?? 0, 'hours')
    .utc()
    .toISOString()
}

const preparePayment = (agreementId, transaction) => {
  const result = {
    amount: Math.round(transaction.cost * 100),
    description: 'The recurring card payment for your rod fishing licence',
    reference: transaction.id,
    authorisation_mode: 'agreement',
    agreement_id: agreementId
  }

  return result
}

const processRecurringPaymentStatus = async payment => {
  try {
    const {
      state: { status }
    } = await getPaymentStatus(payment.paymentId)

    debug(`Payment status for ${payment.paymentId}: ${status}`)

    if (status === PAYMENT_STATUS.Success) {
      try {
        await salesApi.processRPResult(payment.transaction.id, payment.paymentId, payment.created_date)
        debug(`Processed Recurring Payment for ${payment.transaction.id}`)
      } catch (err) {
        console.error(`Failed to process Recurring Payment for ${payment.transaction.id}`, err)
        throw err
      }
    }
    if (status === PAYMENT_STATUS.Failure || status === PAYMENT_STATUS.Error) {
      console.error(
        `Payment failed. Recurring payment agreement for: ${payment.agreementId} set to be cancelled. Updating payment journal.`
      )
      if (await salesApi.getPaymentJournal(payment.transaction.id)) {
        await salesApi.updatePaymentJournal(payment.transaction.id, {
          paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed
        })
      }
      await salesApi.cancelRecurringPayment(payment.transaction.recurringPayment.id)
    }
  } catch (error) {
    const status = error.response?.status

    if (isClientError(status)) {
      console.error(`Failed to fetch status for payment ${payment.paymentId}, error ${status}`)
    } else if (isServerError(status)) {
      console.error(`Payment status API error for ${payment.paymentId}, error ${status}`)
    } else {
      console.error(`Unexpected error fetching payment status for ${payment.paymentId}.`)
    }
  }
}

const shutdown = code => {
  airbrake.flush()
  process.exit(code)
}

process.on('SIGINT', () => shutdown(SIGINT_CODE))
process.on('SIGTERM', () => shutdown(SIGTERM_CODE))
