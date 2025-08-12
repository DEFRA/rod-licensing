'use strict'
import recurringPaymentsJob from 'commander'
import { processRecurringPayments } from './recurring-payments-processor.js'

console.log(
  'Recurring payments job starting at %s. name: %s. version: %s',
  new Date().toISOString(),
  process.env.name,
  process.env.version
)

const delay = parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY || '0', 10)
if (delay > 0) {
  setTimeout(() => {
    executeRecurringPaymentsJob()
  }, delay * 1000)
} else {
  executeRecurringPaymentsJob()
}

function executeRecurringPaymentsJob () {
  recurringPaymentsJob.action(processRecurringPayments())
}

export default recurringPaymentsJob
