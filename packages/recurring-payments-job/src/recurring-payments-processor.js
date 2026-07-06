import moment from 'moment-timezone'
import { PAYMENT_STATUS, SERVICE_LOCAL_TIME, PAYMENT_JOURNAL_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { salesApi, airbrake, HTTPRequestBatcher } from '@defra-fish/connectors-lib'
import { queueRecurringPayment, isGovPayUp, queueRecurringPaymentStatusCheck } from './services/govuk-pay-service.js'
import db from 'debug'

const debug = db('recurring-payments:processor')

const SIGINT_CODE = 130
const SIGTERM_CODE = 137
const PAYMENT_STATUS_DELAY = 60000
const MIN_CLIENT_SUCCESS = 200
const MAX_CLIENT_SUCCESS = 299
const MIN_CLIENT_ERROR = 400
const MAX_CLIENT_ERROR = 499
const MIN_SERVER_ERROR = 500
const MAX_SERVER_ERROR = 599

const isClientError = code => code >= MIN_CLIENT_ERROR && code <= MAX_CLIENT_ERROR
const isServerError = code => code >= MIN_SERVER_ERROR && code <= MAX_SERVER_ERROR
const isSuccessfulResponse = code => code >= MIN_CLIENT_SUCCESS && code <= MAX_CLIENT_SUCCESS

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

  const requestedPayments = await requestPayments(dueRCPayments)
  const payments = requestedPayments.map(requestedPayment => {
    const duePayment = dueRCPayments.find(dueRCPayment => dueRCPayment.entity.agreementId === requestedPayment.agreement_id)
    return {
      paymentId: requestedPayment.payment_id,
      agreementId: duePayment.entity.agreementId,
      recurringPaymentId: duePayment.entity.id,
      transactionId: requestedPayment.reference,
      duePayment,
      requestedPayment
    }
  })
  await new Promise(resolve => setTimeout(resolve, PAYMENT_STATUS_DELAY))
  await checkPaymentStatuses(payments)
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

const logErrors = (results, message) => {
  const failures = results.filter(r => r.status === 'rejected').map(r => r.reason)
  if (failures.length) {
    console.error(message, ...failures)
  }
}

const requestPayments = async dueRCPayments => {
  const createTransactionResults = await Promise.allSettled(
    dueRCPayments.map(async duePayment => {
      const {
        entity: { agreementId, id },
        expanded: {
          activePermission: {
            entity: { referenceNumber }
          }
        }
      } = duePayment
      const transaction = await createNewTransaction(referenceNumber, { agreementId, id })
      return { agreementId, transaction }
    })
  )
  logErrors(createTransactionResults, 'Error creating transactions:')
  const paymentsToRequest = createTransactionResults.filter(ctr => ctr.status === 'fulfilled').map(ctr => ctr.value)

  const batcher = new HTTPRequestBatcher({
    batchSize: Number(process.env.GOV_PAY_GET_BATCH_SIZE),
    delay: Number(process.env.GOV_PAY_BATCH_DELAY_MS)
  })

  for (const { agreementId, transaction } of paymentsToRequest) {
    queueRecurringPayment(preparePayment(agreementId, transaction), batcher)
  }
  await batcher.fetch()

  logErrors(batcher.responseDetails, 'Error requesting payments:')
  await processPaymentResponses(paymentsToRequest, batcher)

  const responses = batcher.responseDetails.map(r => r.responses.at(-1))

  return Promise.all(responses.filter(r => r.status && !isClientError(r.status) && !isServerError(r.status)).map(async r => r.jsonValue))
}

const processPaymentResponses = async (paymentsToRequest, batcher) => {
  for (const paymentToRequest of paymentsToRequest) {
    const responseDetail = batcher.responseDetails.find(rd => rd.reference === paymentToRequest.agreementId)
    const response = responseDetail.responses.at(-1)
    response.jsonValue = response.json ? await response.json() : {}

    if (isSuccessfulResponse(response.status)) {
      await salesApi.createPaymentJournal(paymentToRequest.transaction.id, {
        paymentReference: response.jsonValue.payment_id,
        paymentTimestamp: response.jsonValue.created_date,
        paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.InProgress
      })
    } else {
      const description = response.jsonValue.description || ''
      if (
        description.match(new RegExp(`Invalid attribute value: ${paymentToRequest.agreementId}. Agreement (does not exist|must be active)`))
      ) {
        console.log(
          '%s is an invalid agreementId. Recurring payment %s will be cancelled',
          paymentToRequest.agreementId,
          paymentToRequest.transaction.recurringPayment.id
        )
        await salesApi.cancelRecurringPayment(paymentToRequest.transaction.recurringPayment.id)
      }
      console.error(`Unexpected response from GOV.UK Pay API. 
          Status: ${response.status}, 
          Response: ${JSON.stringify(response.jsonValue)}
          Transaction ID: ${response.jsonValue.reference}
          Payload: ${JSON.stringify(responseDetail.options.body)}
        `)
    }
  }
}

const createNewTransaction = async (referenceNumber, recurringPayment) => {
  const transactionData = await processPermissionData(referenceNumber, recurringPayment)
  return salesApi.createTransaction(transactionData)
}

const processPermissionData = async (referenceNumber, recurringPayment) => {
  const data = await salesApi.preparePermissionDataForRenewal(referenceNumber)
  const { countryCode, ...licenseeWithoutCountryCode } = data.licensee
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

const checkPaymentStatuses = async payments => {
  const batcher = await queuePaymentStatusChecks(payments)
  for (let index = 0; index < batcher.responseDetails.length; index++) {
    const response = batcher.responseDetails[index].responses.at(-1)
    if (isSuccessfulResponse(response.status)) {
      const paymentStatusCheck = await response.json()
      const paymentStatus = paymentStatusCheck.state.status
      debug(`Payment status for ${paymentStatusCheck.payment_id}: ${paymentStatusCheck.state.status}`)

      if (paymentStatus === PAYMENT_STATUS.Success) {
        await handlePaymentStatusSuccess(paymentStatusCheck)
      }
      if ([PAYMENT_STATUS.Failure, PAYMENT_STATUS.Error].includes(paymentStatus)) {
        await handlePaymentStatusFailure(payments[index])
      }
    } else if (isClientError(response.status)) {
      console.error(`Failed to fetch status for payment ${payments[index].paymentId}, error ${response.status}`)
    } else if (isServerError(response.status)) {
      console.error(`Payment status API error for ${payments[index].paymentId}, error ${response.status}`)
    } else {
      console.error(`Unexpected error fetching payment status for ${payments[index].paymentId}.`)
    }
  }
}

const queuePaymentStatusChecks = async payments => {
  const batcher = new HTTPRequestBatcher({
    batchSize: Number(process.env.GOV_PAY_GET_BATCH_SIZE),
    delay: Number(process.env.GOV_PAY_BATCH_DELAY_MS)
  })

  for (const payment of payments) {
    queueRecurringPaymentStatusCheck(payment.paymentId, batcher)
  }

  await batcher.fetch()

  return batcher
}

const handlePaymentStatusSuccess = async paymentStatusCheck => {
  try {
    await salesApi.processRPResult(paymentStatusCheck.reference, paymentStatusCheck.payment_id, paymentStatusCheck.created_date)
  } catch (err) {
    console.error(`Failed to process Recurring Payment for ${paymentStatusCheck.reference}`, err)
  }
}

const handlePaymentStatusFailure = async payment => {
  console.error(`Payment failed. Recurring payment agreement for: ${payment.agreementId} set to be cancelled. Updating payment journal.`)

  if (await salesApi.getPaymentJournal(payment.transactionId)) {
    await salesApi.updatePaymentJournal(payment.transactionId, {
      paymentStatus: PAYMENT_JOURNAL_STATUS_CODES.Failed
    })
  }

  await salesApi.cancelRecurringPayment(payment.recurringPaymentId)
}

const shutdown = code => {
  airbrake.flush()
  process.exit(code)
}

process.on('SIGINT', () => shutdown(SIGINT_CODE))
process.on('SIGTERM', () => shutdown(SIGTERM_CODE))
