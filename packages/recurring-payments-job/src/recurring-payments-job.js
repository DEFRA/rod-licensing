'use strict'
import recurringPaymentsJob from 'commander'
import { execute } from './recurring-payments-processor.js'
import path from 'path'
import fs from 'fs'
import { Notifier } from '@airbrake/node'
import { formatWithOptions, inspect } from 'util'
const pkgPath = path.join(process.cwd(), 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

console.log('Recurring payments job starting at %s. name: %s. version: %s', new Date().toISOString(), pkg.name, pkg.version)

const INSPECT_OPTS = { depth: null, maxStringLength: null, maxArrayLength: null, breakLength: null, compact: true, showHidden: true }
try {
  console.log('creating notifier', process.env.AIRBRAKE_PROJECT_KEY, process.env.AIRBRAKE_HOST, process.env.NODE_ENV)
  const ab = new Notifier({
    projectId: 2,
    projectKey: process.env.AIRBRAKE_PROJECT_KEY,
    host: process.env.AIRBRAKE_HOST,
    environment: process.env.NODE_ENV,
    performanceStats: false
  })
  console.log('notifying')
  ab.notify({
    error: new Error(formatWithOptions(INSPECT_OPTS, 'not really an error')),
    params: { consoleInvocationDetails: { method: 'error', arguments: { 1: inspect('test log message', INSPECT_OPTS) } } },
    environment: { name: process.env.name },
    context: { }
  })
  console.log('notified')
  console.warn('Danger, Will Robinson')
} catch (e) {
  console.log('error notifying: ', e)
}

const delay = parseInt(process.env.RECURRING_PAYMENTS_LOCAL_DELAY || '0', 10)
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
