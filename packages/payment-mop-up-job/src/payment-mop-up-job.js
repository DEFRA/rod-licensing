#!/usr/bin/env node
import paymentMopUpJob from 'commander'
import { execute } from './processors/processor.js'
import { DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES, MAX_INCOMPLETE_PURCHASE_AGE_MINUTES, DEFAULT_SCAN_DURATION_HOURS } from './constants.js'

process.on('uncaughtException', console.error)
process.on('unhandledRejection', console.error)

paymentMopUpJob
  .description('Starts the payment mop-up job')
  .option('-a, --age-minutes <number>', 'The age of the incomplete purchase in minutes', Number, DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES)
  .option(
    '-d, --scan-duration-hours <number>',
    'The number of hours over which the transactions will be scanned',
    Number,
    DEFAULT_SCAN_DURATION_HOURS
  )

paymentMopUpJob.parse(process.argv)

let isOk = true

if (
  isNaN(paymentMopUpJob.ageMinutes) ||
  !Number.isInteger(paymentMopUpJob.ageMinutes) ||
  paymentMopUpJob.ageMinutes > MAX_INCOMPLETE_PURCHASE_AGE_MINUTES ||
  paymentMopUpJob.ageMinutes < 0
) {
  console.error(`--age-minutes: must be an integer between 0 and ${MAX_INCOMPLETE_PURCHASE_AGE_MINUTES}`)
  isOk = false
}

if (
  isNaN(paymentMopUpJob.scanDurationHours) ||
  !Number.isInteger(paymentMopUpJob.scanDurationHours) ||
  paymentMopUpJob.scanDurationHours < 1
) {
  console.error('--scan-duration-hours: must be an integer above 1')
  isOk = false
}

if (isOk) {
  execute(paymentMopUpJob.ageMinutes, paymentMopUpJob.scanDurationHours).catch(console.error)
}

export default paymentMopUpJob
