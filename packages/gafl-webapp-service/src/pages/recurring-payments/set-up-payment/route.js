import { CHOOSE_PAYMENT, SET_UP_PAYMENT, RECURRING_TERMS_CONDITIONS } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { nextPage } from '../../../routes/next-page.js'
import { recurringLicenceTypeDisplay } from '../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { recurringPayReminderDisplay } from '../../../processors/recurring-pay-helper.js'
import { displayPermissionPrice } from '../../../processors/price-display.js'

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const errorMsg = request.i18n.getCatalog().recurring_payment_set_up_error

  return {
    errorMap: {
      agree: {
        'any.required': { ref: '#agree', text: errorMsg }
      }
    },
    cost: displayPermissionPrice(permission, request.i18n.getCatalog()),
    type: recurringLicenceTypeDisplay(permission, request.i18n.getCatalog()),
    reminder: recurringPayReminderDisplay(permission, request.i18n.getCatalog()),
    uri: {
      single: addLanguageCodeToUri(request, CHOOSE_PAYMENT.uri),
      terms: addLanguageCodeToUri(request, RECURRING_TERMS_CONDITIONS.uri)
    }
  }
}

export default pageRoute(SET_UP_PAYMENT.page, SET_UP_PAYMENT.uri, validator, nextPage, getData)
