'use strict'
import notificationJob from 'commander'
import { execute } from './notification-processor.js'
import path from 'path'
import fs from 'fs'
const pkgPath = path.join(process.cwd(), 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))

console.log('Notification job starting at %s. name: %s. version: %s', new Date().toISOString(), pkg.name, pkg.version)

const delay = parseInt(process.env.NOTIFICATION_JOB_LOCAL_DELAY || '0', 10)
if (delay > 0) {
  setTimeout(() => {
    executeNotificationJob()
  }, delay * 1000)
} else {
  executeNotificationJob()
}

function executeNotificationJob () {
  notificationJob.action(execute())
}

export default notificationJob
