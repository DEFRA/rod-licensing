import { ERROR_PAYMENT_TESTING } from '../uri.js'
import errorPaymentTestingHandler from '../handlers/error-payment-testing-handler.js'

export default [
  {
    method: 'GET',
    path: ERROR_PAYMENT_TESTING.uri,
    handler: errorPaymentTestingHandler
  }
]
