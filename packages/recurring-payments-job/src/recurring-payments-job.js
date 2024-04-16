'use strict'
import { Command } from 'commander'
import { processRecurringPayments } from './recurring-payments-processor.js'

const recurringPaymentsJob = new Command()

const delay = parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY || 0, 10)
if (delay > 0) {
  setTimeout(() => {
    recurringPaymentsJob.action(processRecurringPayments())
  }, delay * 1000)
} else {
  recurringPaymentsJob.action(processRecurringPayments())
}

export default recurringPaymentsJob
