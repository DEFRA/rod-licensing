import { salesApi } from '@defra-fish/connectors-lib'

export const processRecurringPayments = async () => {
  if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() === 'true') {
    console.log('Recurring Payments job enabled')
    const date = new Date().toISOString().split('T')[0]
    const response = await salesApi.getDueRecurringPayments(date)
    console.log('Recurring Payments found: ', response)
    response.forEach(async record => await processRecurringPayment(record))
  } else {
    console.log('Recurring Payments job disabled')
  }
}

const processRecurringPayment = async record => {
  const referenceNumber = record.expanded.activePermission.entity.referenceNumber
  console.log('Preparing data for', referenceNumber)
  const data = await salesApi.preparePermissionDataForRenewal(referenceNumber)
  console.log(data)
}
