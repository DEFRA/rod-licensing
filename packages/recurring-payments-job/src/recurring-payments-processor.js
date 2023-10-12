import { getRecurringPayments } from '../../sales-api-service/src/services/recurring-payments.service.js'

export async function processRecurringPayments () {
  // console.log('Recurring Payments job')
  // if (process.env.RUN_RECURRING_PAYMENTS?.toLowerCase() === 'true') {
  //   console.log('Recurring Payments job enabled')
  //   const recurringPayments = await getRecurringPayments()
  //   console.log('Recurring Payments found: ', recurringPayments)
  // } else {
  //   console.log('Recurring Payments job disabled')
  // }

  console.log('Recurring Payments job')
  const recurringPayments = await getRecurringPayments()
  console.log('Recurring Payments found: ', recurringPayments)
}
