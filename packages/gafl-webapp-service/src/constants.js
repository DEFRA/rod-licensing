/**
 * System constants and defaults
 */
export const SALES_API_URL_DEFAULT = 'http://0.0.0.0:4000'
export const SALES_API_TIMEOUT_MS_DEFAULT = 10000
export const ADDRESS_LOOKUP_SERVICE = { lang: 'EN', dataset: 'DPA' }
export const ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT = 10000
export const GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT = 10000
export const SESSION_TTL_MS_DEFAULT = 3 * 60 * 60 * 1000
export const REDIS_PORT_DEFAULT = 6379
export const PAGE_STATE = { completed: true, error: false }
export const PDF_FILENAME = 'fishing-licence-confirmation.pdf'
export const SESSION_COOKIE_NAME_DEFAULT = 'sid'
export const CSRF_TOKEN_COOKIE_NAME_DEFAULT = 'rlsctkn'
export const FEEDBACK_URI_DEFAULT = '#'

export const COMPLETION_STATUS = {
  agreed: 'agreed',
  posted: 'posted',
  paymentCreated: 'payment-created',
  paymentCancelled: 'payment-cancelled',
  paymentFailed: 'payment-failed',
  paymentCompleted: 'payment-completed',
  finalised: 'finalised',
  completed: 'completed'
}

export const GOVPAYFAIL = {
  prePaymentRetry: { step: 'pre-payment' },
  postPaymentRetry: { step: 'post-payment' }
}
