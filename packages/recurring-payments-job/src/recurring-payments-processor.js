import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { salesApi } from '@defra-fish/connectors-lib'

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
  const transactionData = await processPermissionData(referenceNumber)
  console.log('Creating new transaction based on', referenceNumber)
  try {
    const transaction = await salesApi.createTransaction(transactionData)
    const response = await processPayment(transaction)
    console.log('New transaction created:', response)
  } catch (e) {
    console.log('Error creating transaction', JSON.stringify(transactionData))
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

const processPayment = async transaction => {
  try {
    const response = await salesApi.sendPayment(transaction)
    console.log('Payment sent successfully:', response)
    return response
  } catch (e) {
    console.log('Error sending payment', JSON.stringify(transaction))
    throw e
  }
}
