import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { salesApi, govUkPayApi } from '@defra-fish/connectors-lib'
// import {
//   GOVUK_PAY_ERROR_STATUS_CODES,
//   PAYMENT_JOURNAL_STATUS_CODES,
//   TRANSACTION_SOURCE,
//   PAYMENT_TYPE
// } from '@defra-fish/business-rules-lib'

const finaliseTransactionWithGovUkPay = async (transactionId, amount) => {
  try {
    const govUkPayResponse = await govUkPayApi.finaliseTransaction(transactionId, amount)
    console.log('Transaction finalised with GOV.UK Pay:', govUkPayResponse)
  } catch (error) {
    console.error('Error finalising transaction with GOV.UK Pay:', error)
    throw error
  }
}

export const processRecurringPayments = async () => {
  if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() === 'true') {
    console.log('Recurring Payments job enabled')
    const date = new Date().toISOString().split('T')[0]
    const response = await salesApi.getDueRecurringPayments(date)
    console.log('Recurring Payments found: ', response)
    await Promise.all(response.map(record => processRecurringPayment(record)))
  } else {
    console.log('Recurring Payments job disabled')
  }
}

const processRecurringPayment = async record => {
  const referenceNumber = record.expanded.activePermission.entity.referenceNumber
  console.log('Processing recurring payment for reference number: ', referenceNumber)
  const transactionData = await processPermissionData(referenceNumber)
  console.log('Creating new transaction based on', referenceNumber)
  try {
    const response = await salesApi.createTransaction(transactionData)
    if (!response || !response.id || !response.payment || !response.payment.amount) {
      throw new Error('Invalid response structure from createTransaction')
    }
    console.log('New transaction created:', response)

    await finaliseTransactionWithGovUkPay(response.id, response.payment.amount)
  } catch (e) {
    console.error('Error creating or finalising transaction', e)
    throw e
  }
}


const processPermissionData = async referenceNumber => {
  console.log('Preparing data based on', referenceNumber)
  const data = await salesApi.preparePermissionDataForRenewal(referenceNumber)
  const licenseeWithoutCountryCode = Object.assign((({ countryCode: _countryCode, ...l }) => l)(data.licensee))
  return {
    dataSource: 'Recurring Payment',
    permissions: [
      {
        isLicenceForYou: data.isLicenceForYou,
        isRenewal: data.isRenewal,
        issueDate: null,
        licensee: licenseeWithoutCountryCode,
        permitId: data.permitId,
        startDate: prepareStartDate(data)
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
