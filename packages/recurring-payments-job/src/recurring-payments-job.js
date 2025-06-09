'use strict'
import recurringPaymentsJob from 'commander'
import { processRecurringPayments } from './recurring-payments-processor.js'

console.log('Recurring payments job...')
const delay = parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY || '0', 10)
if (delay > 0) {
  console.log('Starting with delay:', delay)
  setTimeout(() => {
    executeRecurringPaymentsJob()
  }, delay * 1000)
} else {
  console.log('Starting immediately')
  executeRecurringPaymentsJob()
}

function executeRecurringPaymentsJob () {
  try {
    console.log('rpjob action', processRecurringPayments, recurringPaymentsJob.action)
    recurringPaymentsJob.action(processRecurringPayments())
    console.log('rpjob post action')
  } catch (e) {
    console.log('Error: ', e.message)
  }
}


export default recurringPaymentsJob
