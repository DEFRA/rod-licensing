import Joi from 'joi'
import moment from 'moment-timezone'

import { START_AFTER_PAYMENT_MINUTES, ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME, validation } from '@defra-fish/business-rules-lib'
import { LICENCE_TO_START } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'

const validator = payload => {
  const licenceStartDate = `${payload['licence-start-date-year']}-${payload['licence-start-date-month']}-${payload['licence-start-date-day']}`
  Joi.assert(
    {
      'licence-start-date': licenceStartDate,
      'licence-to-start': payload['licence-to-start']
    },
    Joi.object({
      'licence-to-start': Joi.string().valid('after-payment', 'another-date').required(),
      'licence-start-date': validation.permission.createLicenceStartDateValidator(Joi)
    }).options({ abortEarly: false, allowUnknown: true })
  )
}

export const getData = async request => {
  const fmt = 'DD MM YYYY'
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    isLicenceForYou,
    exampleStartDate: moment().tz(SERVICE_LOCAL_TIME).add(1, 'days').format(fmt),
    minStartDate: moment().tz(SERVICE_LOCAL_TIME).format(fmt),
    maxStartDate: moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days').format(fmt),
    advancedPurchaseMaxDays: ADVANCED_PURCHASE_MAX_DAYS,
    startAfterPaymentMinutes: START_AFTER_PAYMENT_MINUTES
  }
}

export default pageRoute(LICENCE_TO_START.page, LICENCE_TO_START.uri, validator, nextPage, getData)
