import Joi from 'joi'
import moment from 'moment-timezone'

import JoiDate from '@hapi/joi-date'
import { START_AFTER_PAYMENT_MINUTES, ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME, validation } from '@defra-fish/business-rules-lib'
import { LICENCE_TO_START } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { dateFormats } from '../../../constants.js'
import { nextPage } from '../../../routes/next-page.js'

const JoiX = Joi.extend(JoiDate)
const minYear = new Date().getFullYear()
const maxYear = minYear + 1

const daySchema = () => {
  Joi.when('licence-to-start', {
    is: 'another-date',
    then: Joi.any().required().concat(validation.date.createDayValidator(Joi)),
    otherwise: Joi.any()
  })
}

const monthSchema = () => {
  Joi.when('licence-to-start', {
    is: 'another-date',
    then: Joi.any().required().concat(validation.date.createMonthValidator(Joi))
  })
}

const yearSchema = () => {
  Joi.when('licence-to-start', {
    is: 'another-date',
    then: Joi.any().required().concat(validation.date.createYearValidator(Joi, minYear, maxYear))
  })
}

const licenceStartDateSchema = () => {
  Joi.when('licence-to-start', {
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
}

const validator = payload => {
  const day = payload['licence-start-date-day']
  const month = payload['licence-start-date-month']
  const year = payload['licence-start-date-year']

  const licenceStartDate = { day: parseInt(day), month: parseInt(month), year: parseInt(year) }
  const licenceStartDateOld = `${year}-${month}-${day}`

  Joi.assert(
    {
      'licence-start-date-old': licenceStartDateOld,
      'licence-to-start': payload['licence-to-start'],
      day: day || undefined,
      month: month || undefined,
      year: year || undefined,
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
      day: daySchema,
      month: monthSchema,
      year: yearSchema,
      'licence-start-date': licenceStartDateSchema
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
