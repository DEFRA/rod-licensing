import Joi from 'joi'
import moment from 'moment-timezone'
import { START_AFTER_PAYMENT_MINUTES, ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME, validation } from '@defra-fish/business-rules-lib'
import { LICENCE_TO_START } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'

const LICENCE_TO_START_FIELD = 'licence-to-start'
const AFTER_PAYMENT = 'after-payment'
const ANOTHER_DATE = 'another-date'

const minTime = moment().tz(SERVICE_LOCAL_TIME).startOf('day')
const maxTime = moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days')
const minYear = minTime.year()
const maxYear = maxTime.year()

const daySchema = () => {
  Joi.when(LICENCE_TO_START_FIELD, {
    is: ANOTHER_DATE,
    then: Joi.any().required().concat(validation.date.createDayValidator(Joi)),
    otherwise: Joi.any()
  })
}

const monthSchema = () => {
  Joi.when(LICENCE_TO_START_FIELD, {
    is: ANOTHER_DATE,
    then: Joi.any().required().concat(validation.date.createMonthValidator(Joi))
  })
}

const yearSchema = () => {
  Joi.when(LICENCE_TO_START_FIELD, {
    is: ANOTHER_DATE,
    then: Joi.any().required().concat(validation.date.createYearValidator(Joi, minYear, maxYear))
  })
}

const licenceStartDateSchema = () => {
  Joi.when(LICENCE_TO_START_FIELD, {
    is: ANOTHER_DATE,
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
  const licenceStartDateForRange = `${year}-${month}-${day}`

  Joi.assert(
    {
      'licence-start-date-for-range': licenceStartDateForRange,
      'licence-to-start': payload[LICENCE_TO_START_FIELD],
      day: day || undefined,
      month: month || undefined,
      year: year || undefined,
      'licence-start-date': licenceStartDate
    },
    Joi.object({
      'licence-to-start': Joi.string().valid(AFTER_PAYMENT, ANOTHER_DATE).required(),
      'licence-start-date-for-range': Joi.when(LICENCE_TO_START_FIELD, {
        is: ANOTHER_DATE,
        then: Joi.date().min(minTime).max(maxTime).required()
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
