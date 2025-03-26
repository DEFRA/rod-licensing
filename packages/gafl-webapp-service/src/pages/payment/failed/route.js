import Boom from '@hapi/boom'
import pageRoute from '../../../routes/page-route.js'
import { GOVUK_PAY_ERROR_STATUS_CODES } from '@defra-fish/business-rules-lib'
import { COMPLETION_STATUS } from '../../../constants.js'
import { PAYMENT_FAILED, NEW_TRANSACTION } from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { isRecurringPayment } from '../../../processors/recurring-pay-helper.js'

export const getData = async request => {
  const status = await request.cache().helpers.status.get()
  const transaction = await request.cache().helpers.transaction.get()

  // If the cancelled flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.paymentFailed]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no agreed flag set')
  }

  return {
    codes: GOVUK_PAY_ERROR_STATUS_CODES,
    'failure-code': status.payment.code,
    recurringPayment: isRecurringPayment(transaction),
    uri: {
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

export default pageRoute(PAYMENT_FAILED.page, PAYMENT_FAILED.uri, null, nextPage, getData)
