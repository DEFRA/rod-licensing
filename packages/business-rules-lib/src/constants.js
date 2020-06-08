/**
 * Constants pertaining to general business rules
 */

// The maximum days in advance of the purchase date that the licence may start
export const ADVANCED_PURCHASE_MAX_DAYS = 30

// The  maximum number of permissions in a (multi-buy) transaction
export const MAX_PERMISSIONS_PER_TRANSACTION = 50

// Allowed status values for the payment journal
export const PAYMENT_JOURNAL_STATUS_CODES = {
  InProgress: 'In Progress',
  Cancelled: 'Cancelled',
  Failed: 'Failed',
  Expired: 'Expired',
  Completed: 'Completed'
}

/*
 * Failure states returned by the GOV.UK pay API
 * https://docs.payments.service.gov.uk/api_reference/#errors-caused-by-payment-statuses
 */
export const GOVUK_PAY_ERROR_STATUS_CODES = {
  REJECTED: 'P0010',
  EXPIRED: 'P0020',
  USER_CANCELLED: 'P0030',
  ERROR: 'P0050'
}

/**
 * Constants used in finalization
 * @type {{telesales: string, govPay: string}}
 */
export const TRANSACTION_SOURCE = { govPay: 'Gov Pay', telesales: 'Telesales' }
export const PAYMENT_TYPE = { debit: 'Debit card' }
