'use strict'
import { Command } from 'commander'
import { processRecurringPayments } from './recurring-payments-processor.js'

const rpJob = new Command()

rpJob.action(processRecurringPayments())

export default rpJob
