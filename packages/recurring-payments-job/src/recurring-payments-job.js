'use strict'

import { Command } from 'commander'
import { processRecurringPayments } from './recurring-payments-processor.js'

const recurringPaymentsJob = () => {
  const rpJob = new Command()

  const delay = parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY || 0, 10)

  if (delay > 0) {
    startWithDelay(rpJob, delay)
  } else {
    rpJob.action(processRecurringPayments())
  }

  return rpJob
}

const startWithDelay = (rpJob, delay) => {
  setTimeout(() => {
    rpJob.action(processRecurringPayments())
  }, delay * 1000)
}

export default recurringPaymentsJob
