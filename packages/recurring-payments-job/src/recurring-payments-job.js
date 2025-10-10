'use strict'
import recurringPaymentsJob from 'commander'
import { execute } from './recurring-payments-processor.js'
import path from 'path'
import fs from 'fs'
const pkgPath = path.join(process.cwd(), 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

console.log('Recurring payments job starting at %s. name: %s. version: %s', new Date().toISOString(), pkg.name, pkg.version)

const delay = 0// parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY || '0', 10)
if (delay > 0) {
  setTimeout(() => {
    console.log('executing RP job')
    executeRecurringPaymentsJob()
    console.log('RP job executed')
  }, delay * 1000)
} else {
  console.log('executing RP job')
  executeRecurringPaymentsJob()
  console.log('RP job executed')
}

function executeRecurringPaymentsJob () {
  recurringPaymentsJob.action(execute())
}

export default recurringPaymentsJob
