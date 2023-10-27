import { salesApi } from '@defra-fish/connectors-lib'

export async function processRecurringPayments () {
  console.log('Recurring Payments job')
  if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() === 'true') {
    console.log('Recurring Payments job enabled')
    const date = '17-10-2023'
    const response = await salesApi.getDueRecurringPayments(date)
    console.log('Recurring Payments found: ', response.data)
  } else {
    console.log('Recurring Payments job disabled')
  }
}
