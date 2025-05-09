/**
 * The maximum days in advance of the purchase date that the licence may start
 * @type {number}
 */
export const ADVANCED_PURCHASE_MAX_DAYS = 30

/**
 * The  maximum number of permissions in a (multi-buy) transaction
 * @type {number}
 */
export const MAX_PERMISSIONS_PER_TRANSACTION = 50

/**
 * Allowed status values for the payment journal
 */
export const PAYMENT_JOURNAL_STATUS_CODES = {
  InProgress: 'In Progress',
  Cancelled: 'Cancelled',
  Failed: 'Failed',
  Expired: 'Expired',
  Completed: 'Completed'
}

/**
 * Payment status returned by the GOV.UK pay API
 */
export const PAYMENT_STATUS = {
  Success: 'success',
  Failure: 'failed'
}

/**
 * Failure states returned by the GOV.UK pay API
 * https://docs.payments.service.gov.uk/api_reference/#errors-caused-by-payment-statuses
 */
export const GOVUK_PAY_ERROR_STATUS_CODES = {
  REJECTED: 'P0010',
  EXPIRED: 'P0020',
  USER_CANCELLED: 'P0030',
  ERROR: 'P0050',
  NOT_FOUND: 'P0200'
}

/**
 * Constants used in finalization
 * @type {{telesales: string, govPay: string}}
 */
export const TRANSACTION_SOURCE = { govPay: 'Gov Pay', telesales: 'Telesales' }
export const PAYMENT_TYPE = { debit: 'Debit card' }

/**
 * Data sources associated with POCL transactions
 */
export const POCL_DATA_SOURCE = 'Post Office Sales'
export const DDE_DATA_SOURCE = 'DDE File'
export const POCL_TRANSACTION_SOURCES = [POCL_DATA_SOURCE, DDE_DATA_SOURCE]

/**
 * Describes the lifetime of the renewal link.
 */
export const RENEW_BEFORE_DAYS = 60 // The number of days before licence expiry the link is active
export const RENEW_AFTER_DAYS = 60 // The number of days after licence expiry the link is active

/**
 * The number of minutes after payment that a licence will start
 * @type {number}
 */
export const START_AFTER_PAYMENT_MINUTES = 30

/**
 * Timezone of the service
 */
export const SERVICE_LOCAL_TIME = 'Europe/London'

/**
 * Date for switching paper fulfilment provider
 */
export const FULFILMENT_SWITCHOVER_DATE = '2024-05-30T23:00:00.000Z'
