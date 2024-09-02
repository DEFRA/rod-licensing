import Joi from 'joi'
import moment from 'moment-timezone'

import JoiDate from '@hapi/joi-date'
import { START_AFTER_PAYMENT_MINUTES, ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME, validation } from '@defra-fish/business-rules-lib'
import { LICENCE_TO_START } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { dateFormats } from '../../../constants.js'
import { nextPage } from '../../../routes/next-page.js'

const JoiX = Joi.extend(JoiDate)

const validator = payload => {
  const minYear = new Date().getFullYear()
  const maxYear = minYear + 1

  const day = payload['licence-start-date-day'] || undefined
  const month = payload['licence-start-date-month'] || undefined
  const year = payload['licence-start-date-year'] || undefined
  const licenceStartDate = {
    day: parseInt(payload['licence-start-date-day']),
    month: parseInt(payload['licence-start-date-month']),
    year: parseInt(payload['licence-start-date-year'])
  }

  const licenceStartDateOld = `${payload['licence-start-date-year']}-${payload['licence-start-date-month']}-${payload['licence-start-date-day']}`
  Joi.assert(
    {
      'licence-start-date-old': licenceStartDateOld,
      'licence-to-start': payload['licence-to-start'],
      day,
      month,
      year,
      'licence-start-date': licenceStartDate
    },
    Joi.object({
      'licence-to-start': Joi.string().valid('after-payment', 'another-date').required(),
      'licence-start-date-old': Joi.alternatives().conditional('licence-to-start', {
        is: 'another-date',
        then: JoiX.date()
          .format(dateFormats)
          .min(moment().tz(SERVICE_LOCAL_TIME).startOf('day'))
          .max(moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days'))
          .required(),
        otherwise: Joi.string().empty('')
      }),
      day: Joi.when('licence-to-start', {
        is: 'another-date',
        then: Joi.any().required().concat(validation.date.createDayValidator(Joi)),
        otherwise: Joi.any()
      }),
      month: Joi.when('licence-to-start', {
        is: 'another-date',
        then: Joi.any().required().concat(validation.date.createMonthValidator(Joi))
      }),
      year: Joi.when('licence-to-start', {
        is: 'another-date',
        then: Joi.any().required().concat(validation.date.createYearValidator(Joi, minYear, maxYear))
      }),
      'licence-start-date': Joi.when('licence-to-start', {
        is: 'another-date',
        then: Joi.when(
          Joi.object({
            day: Joi.any().required().concat(validation.date.createDayValidator(Joi)),
            month: Joi.any().required().concat(validation.date.createMonthValidator(Joi)),
            year: Joi.any().required().concat(validation.date.createYearValidator(Joi, minYear, maxYear))
          }).unknown(),
          {
            then: validation.date.createRealDateValidator(Joi)
          }
        )
      })
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
