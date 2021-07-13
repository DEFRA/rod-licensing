/**
 * System constants and defaults
 */
export const ADDRESS_LOOKUP_SERVICE = { lang: 'EN', dataset: 'DPA' }
export const ADDRESS_LOOKUP_TIMEOUT_MS_DEFAULT = 10000
export const ATTRIBUTION_REDIRECT_DEFAULT = '/'
export const SESSION_TTL_MS_DEFAULT = 3 * 60 * 60 * 1000
export const PORT_DEFAULT = 3000
export const REDIS_PORT_DEFAULT = 6379
export const PAGE_STATE = { completed: true, error: false }
export const SESSION_COOKIE_NAME_DEFAULT = 'sid'
export const CSRF_TOKEN_COOKIE_NAME_DEFAULT = 'rlsctkn'
export const FEEDBACK_URI_DEFAULT = '#'
export const CHANNEL_DEFAULT = 'websales'
export const SERVICE_PAGE_DEFAULT = 'https://www.gov.uk/fishing-licences/buy-a-fishing-licence'

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

export const UTM = {
  CAMPAIGN: 'utm_campaign',
  MEDIUM: 'utm_medium',
  SOURCE: 'utm_source',
  TERM: 'utm_term',
  CONTENT: 'utm_content'
}

export const dateFormats = ['YYYY-MM-DD', 'YY-MM-DD', 'YYYY-M-DD', 'YY-M-DD', 'YYYY-MM-D', 'YY-MM-D', 'YYYY-M-D', 'YY-M-D']

export const CommonResults = {
  SUMMARY: 'summary',
  OK: 'ok',
  NO: 'no',
  YES: 'yes'
}

export const allowsPhysicalLicence = {
  YES: 'yes',
  NO: 'no'
}

// If the user has seen the summary page these are set in the status
export const CONTACT_SUMMARY_SEEN = 'contact-summary'
export const LICENCE_SUMMARY_SEEN = 'licence-summary'

// These cookies are used by the load balancer
export const ALB_COOKIE_NAME = 'AWSALBTG'
export const ALBCORS_COOKIE_NAME = 'AWSALBTGCORS'
