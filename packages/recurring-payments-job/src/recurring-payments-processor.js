import { salesApi } from '@defra-fish/connectors-lib'

export async function processRecurringPayments () {
  console.log('Recurring Payments job')
  if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() === 'true') {
    console.log('Recurring Payments job enabled')
    const recurringPayments = await salesApi.getDueRecurringPayments()
    console.log('Recurring Payments found: ', recurringPayments)
  } else {
    console.log('Recurring Payments job disabled')
  }
}
