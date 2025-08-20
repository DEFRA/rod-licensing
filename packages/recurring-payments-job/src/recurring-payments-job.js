'use strict'
import recurringPaymentsJob from 'commander'
import { processRecurringPayments } from './recurring-payments-processor.js'
import path from 'path'
import fs from 'fs'

const pkgPath = path.join(process.cwd(), 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

console.log('Recurring payments job starting at %s. name: %s. version: %s', new Date().toISOString(), pkg.name, pkg.version)

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
