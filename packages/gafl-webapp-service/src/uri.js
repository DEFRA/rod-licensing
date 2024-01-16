/*
 * Page locations, templates
 */
export const PROCESS_ANALYTICS_PREFERENCES = { uri: '/buy/process-analytics-preferences', page: 'process-analytics-preferences' }

export const LICENCE_FOR = { uri: '/buy/licence-for', page: 'licence-for' }
export const LICENCE_LENGTH = { uri: '/buy/licence-length', page: 'licence-length' }
export const LICENCE_TYPE = { uri: '/buy/licence-type', page: 'licence-type' }
export const LICENCE_TO_START = { uri: '/buy/start-kind', page: 'licence-to-start' }
export const LICENCE_START_TIME = { uri: '/buy/start-time', page: 'licence-start-time' }

export const NO_LICENCE_REQUIRED = { uri: '/buy/no-licence-required', page: 'no-licence-required' }
export const DISABILITY_CONCESSION = { uri: '/buy/disability-concession', page: 'disability-concession' }
export const DATE_OF_BIRTH = { uri: '/buy/date-of-birth', page: 'date-of-birth' }

export const NAME = { uri: '/buy/name', page: 'name' }
export const ADDRESS_LOOKUP = { uri: '/buy/find-address', page: 'address-lookup' }
export const ADDRESS_SELECT = { uri: '/buy/select-address', page: 'address-select' }
export const ADDRESS_ENTRY = { uri: '/buy/address', page: 'address-entry' }
export const CONTACT = { uri: '/buy/contact', page: 'contact' }
export const NEWSLETTER = { uri: '/buy/newsletter', page: 'newsletter' }

export const LICENCE_FULFILMENT = { uri: '/buy/fulfilment', page: 'licence-fulfilment' }
export const LICENCE_CONFIRMATION_METHOD = { uri: '/buy/confirmation-method', page: 'licence-confirmation-method' }
export const CHECK_CONFIRMATION_CONTACT = { uri: '/buy/check-confirmation-contact', page: 'check-confirmation-contact' }

export const CONTACT_SUMMARY = { uri: '/buy/contact-summary', page: 'contact-summary' }
export const LICENCE_SUMMARY = { uri: '/buy/licence-summary', page: 'licence-summary' }

export const PAYMENT_CANCELLED = { uri: '/buy/payment-cancelled', page: 'payment-cancelled' }
export const PAYMENT_FAILED = { uri: '/buy/payment-failed', page: 'payment-failed' }

export const TERMS_AND_CONDITIONS = { uri: '/buy/conditions', page: 'terms-and-conditions' }
export const ORDER_COMPLETE = { uri: '/buy/order-complete', page: 'order-complete' }
export const LICENCE_DETAILS = { uri: '/buy/licence-details', page: 'licence-details' }

export const OIDC_SIGNIN = { uri: '/oidc/signin' }
export const OIDC_ROLE_REQUIRED = { uri: '/oidc/role-required', page: 'role-required' }
export const OIDC_ACCOUNT_DISABLED = { uri: '/oidc/account-disabled', page: 'account-disabled' }

/**
 * Renewals pages
 * @type {{uri: string}}
 */
export const RENEWAL_BASE = { uri: '/renew' }
export const RENEWAL_PUBLIC = { uri: '/renew/{referenceNumber?}' }
export const IDENTIFY = { uri: '/buy/renew/identify', page: 'identify' }
export const RENEWAL_INACTIVE = { uri: '/buy/renew/inactive', page: 'renewal-inactive' }
export const AUTHENTICATE = { uri: '/buy/renew/authenticate' }
export const RENEWAL_START_DATE = { uri: '/buy/renew/renewal-start-date', page: 'renewal-start-date' }

export const CONTROLLER = { uri: '/buy' }
export const NEW_TRANSACTION = { uri: '/buy/new' }
export const ADD_PERMISSION = { uri: '/buy/add' }
export const AGREED = { uri: '/buy/agreed' }

export const CLIENT_ERROR = { uri: '/buy/client-error', page: 'client-error' }
export const SERVER_ERROR = { uri: '/buy/server-error', page: 'server-error' }
export const ERROR_TESTING = { uri: '/buy/throw-error' }

export const CHOOSE_PAYMENT = { uri: '/buy/choose-payment', page: 'choose-payment' }
export const SET_UP_PAYMENT = { uri: '/buy/set-up-recurring-card-payment', page: 'set-up-payment' }

/**
 * These are informational static pages
 */
export const COOKIES = { uri: '/guidance/cookies', page: 'cookies' }
export const ACCESSIBILITY_STATEMENT = { uri: '/guidance/accessibility-statement', page: 'accessibility-statement' }
export const PRIVACY_POLICY = { uri: '/guidance/privacy-policy', page: 'privacy-policy' }
export const REFUND_POLICY = { uri: '/guidance/refund-policy', page: 'refund-policy' }
export const OS_TERMS = { uri: '/guidance/os-terms', page: 'os-terms' }
export const NEW_PRICES = { uri: '/guidance/new-prices', page: 'new-prices' }
export const RECURRING_TERMS_CONDITIONS = { uri: '/guidance/recurring-payment-terms-conditions', page: 'recurring-payment-terms-conditions' }

/**
 * These are inserted at runtime by the test framework but the session manager needs to know about them
 */
export const TEST_STATUS = { uri: '/buy/status' }
export const TEST_TRANSACTION = { uri: '/buy/transaction' }
export const TEST_ANALYTICS = { uri: '/buy/analytics' }
export const GET_PRICING_TYPES = { uri: '/buy/get-pricing/types' }
export const GET_PRICING_LENGTHS = { uri: '/buy/get-pricing/lengths' }

export const FRESHWATER_FISING_RULES = { uri: 'https://www.gov.uk/freshwater-rod-fishing-rules' }
export const LOCAL_BYELAWS = { uri: 'https://www.gov.uk/government/collections/local-fishing-byelaws' }
