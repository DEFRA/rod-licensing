import { CHOOSE_PAYMENT, SET_UP_PAYMENT, TERMS_AND_CONDITIONS } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { nextPage } from '../../../routes/next-page.js'
import { recurringLicenceTypeDisplay } from '../../../processors/licence-type-display.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { recurringPayReminderDisplay } from '../../../processors/recurring-pay-reminder-display.js'
import { displayPermissionPrice } from '../../../processors/price-display.js'

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    cost: displayPermissionPrice(permission, request.i18n.getCatalog()),
    type: recurringLicenceTypeDisplay(permission, request.i18n.getCatalog()),
    reminder: recurringPayReminderDisplay(permission, request.i18n.getCatalog()),
    uri: {
      single: addLanguageCodeToUri(request, CHOOSE_PAYMENT.uri),
      terms: addLanguageCodeToUri(request, TERMS_AND_CONDITIONS.uri) // update when rp terms and conditions created
    }
  }
}

export default pageRoute(SET_UP_PAYMENT.page, SET_UP_PAYMENT.uri, validator, nextPage, getData)
