import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { salesApi } from '@defra-fish/connectors-lib'
import { getPaymentStatus, sendPayment } from './services/govuk-pay-service.js'
import { isClientError, isServerError } from 'http-response-status-code'

const PAYMENT_STATUS_DELAY = 60000
const payments = []
const PAYMENT_STATUS_SUCCESS = 'success'

export const processRecurringPayments = async () => {
  if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() === 'true') {
    console.log('Recurring Payments job enabled')
    const date = new Date().toISOString().split('T')[0]
    try {
      const response = await salesApi.getDueRecurringPayments(date)
      console.log('Recurring Payments found: ', response)
      await Promise.all(response.map(record => processRecurringPayment(record)))
      if (response.length > 0) {
        await new Promise(resolve => setTimeout(resolve, PAYMENT_STATUS_DELAY))
        await Promise.all(response.map(record => processRecurringPaymentStatus(record)))
      }
    } catch (error) {
      console.error('Run aborted. Error fetching due recurring payments:', error)
      throw error
    }
  } else {
    console.log('Recurring Payments job disabled')
  }
}

const processRecurringPayment = async record => {
  const referenceNumber = record.expanded.activePermission.entity.referenceNumber
  const agreementId = record.entity.agreementId
  const transaction = await createNewTransaction(referenceNumber, agreementId)
  await takeRecurringPayment(agreementId, transaction)
}

const createNewTransaction = async (referenceNumber, agreementId) => {
  const transactionData = await processPermissionData(referenceNumber, agreementId)
  console.log('Creating new transaction based on', referenceNumber, 'with agreementId', agreementId)
  try {
    const response = await salesApi.createTransaction(transactionData)
    console.log('New transaction created:', response)
    return response
  } catch (e) {
    console.log('Error creating transaction', JSON.stringify(transactionData))
    throw e
  }
}

const takeRecurringPayment = async (agreementId, transaction) => {
  const preparedPayment = preparePayment(agreementId, transaction)
  console.log('Requesting payment:', preparedPayment)
  const payment = await sendPayment(preparedPayment)
  payments.push({
    agreementId,
    paymentId: payment.payment_id,
    created_date: payment.created_date,
    transaction
  })
}

const processPermissionData = async (referenceNumber, agreementId) => {
  console.log('Preparing data based on', referenceNumber, 'with agreementId', agreementId)
  const data = await salesApi.preparePermissionDataForRenewal(referenceNumber)
  const licenseeWithoutCountryCode = Object.assign((({ countryCode: _countryCode, ...l }) => l)(data.licensee))
  return {
    dataSource: 'Recurring Payment',
    agreementId,
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

const processRecurringPaymentStatus = async record => {
  const agreementId = record.entity.agreementId
  const paymentId = getPaymentId(agreementId)

  try {
    const {
      state: { status }
    } = await getPaymentStatus(paymentId)

    console.log(`Payment status for ${paymentId}: ${status}`)
    if (status === PAYMENT_STATUS_SUCCESS) {
      const payment = payments.find(p => p.paymentId === paymentId)
      await salesApi.processRPResult(payment.transaction.id, paymentId, payment.created_date)
    }
  } catch (error) {
    const status = error.response?.status

    if (isClientError(status)) {
      console.error(`Failed to fetch status for payment ${paymentId}, error ${status}`)
    } else if (isServerError(status)) {
      console.error(`Payment status API error for ${paymentId}, error ${status}`)
    } else {
      console.error(`Unexpected error fetching payment status for ${paymentId}`, error)
    }
  }
}

const getPaymentId = agreementId => {
  return payments.find(p => p.agreementId === agreementId).paymentId
}
