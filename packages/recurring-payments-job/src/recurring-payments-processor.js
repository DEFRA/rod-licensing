import { salesApi } from '@defra-fish/connectors-lib'

export const processRecurringPayments = async () => {
  if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() === 'true') {
    console.log('Recurring Payments job enabled')
    const date = new Date()
    const response = await salesApi.getDueRecurringPayments(date)
    console.log('Recurring Payments found: ', response)
  } else {
    console.log('Recurring Payments job disabled')
  }
}
