import { execute } from './processors/processor.js'
import { DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES, DEFAULT_SCAN_DURATION_HOURS } from './constants.js'

const incompletePurchaseAgeMinutes = Number(process.env.INCOMPLETE_PURCHASE_AGE_MINUTES || DEFAULT_INCOMPLETE_PURCHASE_AGE_MINUTES)
const scanDurationHours = Number(process.env.SCAN_DURATION_HOURS || DEFAULT_SCAN_DURATION_HOURS)

execute(incompletePurchaseAgeMinutes, scanDurationHours).catch(console.error)
