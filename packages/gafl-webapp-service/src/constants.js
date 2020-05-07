/**
 * System constants and defaults
 */
const SALES_API_URL_DEFAULT = 'http://0.0.0.0:4000'
const SALES_API_TIMEOUT_MS_DEFAULT = 10000
const ADDRESS_LOOKUP_SERVICE = { lang: 'EN', dataset: 'DPA' }
const ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT = 10000
const GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT = 10000
const SESSION_TTL_MS_DEFAULT = 3 * 60 * 60 * 1000
const REDIS_PORT_DEFAULT = 6379
const SESSION_COOKIE_NAME_DEFAULT = 'sid'
const PAGE_STATE = { completed: true, error: false }

const COMPLETION_STATUS = {
  agreed: 'agreed',
  posted: 'posted',
  paymentCreated: 'payment-created',
  paymentCancelled: 'payment-cancelled',
  paymentFailed: 'payment-failed',
  paymentCompleted: 'payment-completed',
  finalised: 'finalised',
  completed: 'completed'
}

const GOVPAYFAIL = {
  prePaymentRetry: { step: 'pre-payment' },
  postPaymentRetry: { step: 'post-payment' }
}

export {
  SESSION_TTL_MS_DEFAULT,
  REDIS_PORT_DEFAULT,
  SESSION_COOKIE_NAME_DEFAULT,
  SALES_API_URL_DEFAULT,
  ADDRESS_LOOKUP_SERVICE,
  ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT,
  SALES_API_TIMEOUT_MS_DEFAULT,
  GOV_PAY_REQUEST_TIMEOUT_MS_DEFAULT,
  PAGE_STATE,
  COMPLETION_STATUS,
  GOVPAYFAIL
}
