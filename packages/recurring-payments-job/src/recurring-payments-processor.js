import moment from 'moment-timezone'
import { PAYMENT_STATUS, SERVICE_LOCAL_TIME, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { salesApi, airbrake, HTTPRequestBatcher } from '@defra-fish/connectors-lib'
import { isGovPayUp } from './services/govuk-pay-service.js'
import db from 'debug'

const debug = db('recurring-payments:processor')

const SIGINT_CODE = 130
const SIGTERM_CODE = 137
const PAYMENT_STATUS_DELAY = 60000
const GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT = 10000
const INVALID_AGREEMENT_MESSAGE = 'Agreement does not exist'
const MIN_CLIENT_ERROR = 400
const MAX_CLIENT_ERROR = 499
const MIN_SERVER_ERROR = 500
const MAX_SERVER_ERROR = 599

const isClientError = code => code >= MIN_CLIENT_ERROR && code <= MAX_CLIENT_ERROR
const isServerError = code => code >= MIN_SERVER_ERROR && code <= MAX_SERVER_ERROR

const govPayRecurringHeaders = () => ({
  accept: 'application/json',
  authorization: `Bearer ${process.env.GOV_PAY_RECURRING_APIKEY}`,
  'content-type': 'application/json'
})

const createBatcher = () =>
  new HTTPRequestBatcher({
    batchSize: process.env.RCP_BATCHER_BATCH_SIZE ? Number(process.env.RCP_BATCHER_BATCH_SIZE) : undefined,
    delay: process.env.RCP_BATCHER_DELAY_MS ? Number(process.env.RCP_BATCHER_DELAY_MS) : undefined
  })

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

  await processAllPaymentStatuses(payments)
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

const createNewTransaction = async (referenceNumber, recurringPayment) => {
  const transactionData = await processPermissionData(referenceNumber, recurringPayment)
  return salesApi.createTransaction(transactionData)
}

const requestPayments = async dueRCPayments => {
  const transactionResults = await Promise.allSettled(
    dueRCPayments.map(async record => {
      const referenceNumber = record.expanded.activePermission.entity.referenceNumber
      const { agreementId, id } = record.entity
      const transaction = await createNewTransaction(referenceNumber, { agreementId, id })
      return { agreementId, transaction }
    })
  )

  const failures = transactionResults.filter(r => r.status === 'rejected').map(f => f.reason)
  if (failures.length) {
    console.error('Error requesting payments:', ...failures)
  }

  const validTransactions = transactionResults.filter(r => r.status === 'fulfilled').map(r => r.value)
  if (!validTransactions.length) {
    return []
  }

  return batchCreatePayments(validTransactions)
}

const batchCreatePayments = async validTransactions => {
  const batcher = createBatcher()
  const transactionMap = new Map()
  const requestsMetadata = []

  for (const { agreementId, transaction } of validTransactions) {
    const preparedPayment = preparePayment(agreementId, transaction)
    batcher.addRequest(process.env.GOV_PAY_API_URL, {
      headers: govPayRecurringHeaders(),
      method: 'post',
      body: JSON.stringify(preparedPayment),
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
    transactionMap.set(transaction.id, { agreementId, transaction })
    requestsMetadata.push({ agreementId, transaction })
  }

  await batcher.fetch()

  const retriedIndices = []
  const payments = []

  for (let i = 0; i < requestsMetadata.length; i++) {
    const response = batcher.responses[i]
    if (response.status === 429) {
      retriedIndices.push(i)
      continue
    }
    await processPaymentCreationResponse(response, requestsMetadata[i], transactionMap, payments)
  }

  for (let j = 0; j < retriedIndices.length; j++) {
    const response = batcher.responses[requestsMetadata.length + j]
    if (response) {
      await processPaymentCreationResponse(response, requestsMetadata[retriedIndices[j]], transactionMap, payments)
    }
  }

  return payments
}

const processPaymentCreationResponse = async (response, metadata, transactionMap, payments) => {
  const { agreementId, transaction } = metadata
  const body = await response.json()

  if (!response.ok) {
    if (body.description?.includes(INVALID_AGREEMENT_MESSAGE)) {
      console.log('%s is an invalid agreementId. Recurring payment %s will be cancelled', agreementId, transaction.recurringPayment?.id)
      await salesApi.cancelRecurringPayment(transaction.recurringPayment?.id)
    } else {
      console.error(
        `Unexpected response from GOV.UK Pay API. Status: ${response.status}, Response: ${JSON.stringify(body)}, Transaction ID: ${transaction.id}`
      )
    }
    return
  }

  const correlatedMetadata = transactionMap.get(body.reference) ?? metadata

  await salesApi.createPaymentJournal(correlatedMetadata.transaction.id, {
    paymentReference: body.payment_id,
    paymentTimestamp: body.created_date,
    paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
  })

  payments.push({
    agreementId: correlatedMetadata.agreementId,
    paymentId: body.payment_id,
    created_date: body.created_date,
    transaction: correlatedMetadata.transaction
  })
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

const processAllPaymentStatuses = async payments => {
  const batcher = createBatcher()
  const paymentMap = new Map()

  for (const payment of payments) {
    batcher.addRequest(`${process.env.GOV_PAY_API_URL}/${payment.paymentId}`, {
      headers: govPayRecurringHeaders(),
      method: 'get',
      timeout: process.env.GOV_PAY_REQUEST_TIMEOUT_MS || GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT
    })
    paymentMap.set(payment.paymentId, payment)
  }

  await batcher.fetch()

  await Promise.allSettled(batcher.responses.map(response => processPaymentStatusResponse(response, paymentMap)))
}

const processPaymentStatusResponse = async (response, paymentMap) => {
  if (response.status === 429) {
    return
  }

  const paymentId = response.url.split('/').pop()
  const payment = paymentMap.get(paymentId)

  if (!payment) {
    console.error(`Could not find payment data for paymentId: ${paymentId}`)
    return
  }

  try {
    if (!response.ok) {
      const status = response.status
      if (isClientError(status)) {
        console.error(`Failed to fetch status for payment ${paymentId}, error ${status}`)
      } else if (isServerError(status)) {
        console.error(`Payment status API error for ${paymentId}, error ${status}`)
      } else {
        console.error(`Unexpected error fetching payment status for ${paymentId}.`)
      }
      return
    }

    const { state: { status } } = await response.json()

    debug(`Payment status for ${paymentId}: ${status}`)

    if (status === PAYMENT_STATUS.Success) {
      try {
        await salesApi.processRPResult(payment.transaction.id, paymentId, payment.created_date)
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
      console.error(`Failed to fetch status for payment ${paymentId}, error ${status}`)
    } else if (isServerError(status)) {
      console.error(`Payment status API error for ${paymentId}, error ${status}`)
    } else {
      console.error(`Unexpected error fetching payment status for ${paymentId}.`)
    }
  }
}

const shutdown = code => {
  airbrake.flush()
  process.exit(code)
}

process.on('SIGINT', () => shutdown(SIGINT_CODE))
process.on('SIGTERM', () => shutdown(SIGTERM_CODE))
