'use strict'
import { Command } from 'commander'
import { processRecurringPayments } from './recurring-payments-processor.js'

const recurringPaymentsJob = new Command()

recurringPaymentsJob.action(processRecurringPayments())

export default recurringPaymentsJob
