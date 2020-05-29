#!/usr/bin/env node
import paymentMopUpJob from 'commander'
import { execute } from './processors/processor.js'
import { DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES, MAX_INCOMPLETE_PURCHASE_AGE_MINUTES } from './constants.js'

paymentMopUpJob
  .description('Starts the payment mop-up job')
  .option('-a, --age-minutes <number>', 'The age of the incomplete purchase in minutes', Number, DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES)

paymentMopUpJob.parse(process.argv)

if (
  isNaN(paymentMopUpJob.ageMinutes) ||
  !Number.isInteger(paymentMopUpJob.ageMinutes) ||
  paymentMopUpJob.ageMinutes > MAX_INCOMPLETE_PURCHASE_AGE_MINUTES ||
  paymentMopUpJob.ageMinutes < 0
) {
  console.error(`--age-minutes: must be an integer between 0 and ${MAX_INCOMPLETE_PURCHASE_AGE_MINUTES}`)
  process.exit(1)
}

execute(paymentMopUpJob.ageMinutes).catch(err => {
  console.error(err)
  process.exit(1)
})

export default paymentMopUpJob
