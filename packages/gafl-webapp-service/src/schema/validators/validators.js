import Joi from 'joi'
import moment from 'moment'
import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { dateSchema, dateSchemaInput } from '../date.schema.js'

const MAX_AGE = 120
const LICENCE_TO_START_FIELD = 'licence-to-start'
const AFTER_PAYMENT = 'after-payment'
const ANOTHER_DATE = 'another-date'

const validateDate = (day, month, year, minDate, maxDate) => {
  Joi.assert(dateSchemaInput(day, month, year), dateSchema)
  const dateRange = moment(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 'YYYY-MM-DD')
    .tz(SERVICE_LOCAL_TIME)
    .startOf('day')
    .toDate()
  Joi.assert({ 'date-range': dateRange }, Joi.object({ 'date-range': Joi.date().min(minDate).max(maxDate) }))
}

export const dateOfBirthValidator = payload => {
  const day = payload['date-of-birth-day']
  const month = payload['date-of-birth-month']
  const year = payload['date-of-birth-year']

  const minDate = moment().tz(SERVICE_LOCAL_TIME).subtract(MAX_AGE, 'years').startOf('day').toDate()
  const maxDate = moment().tz(SERVICE_LOCAL_TIME).subtract(1, 'day').startOf('day').toDate()
  validateDate(day, month, year, minDate, maxDate)
}

export const startDateValidator = payload => {
  Joi.assert(
    { 'licence-to-start': payload[LICENCE_TO_START_FIELD] },
    Joi.object({ 'licence-to-start': Joi.string().valid(AFTER_PAYMENT, ANOTHER_DATE).required() })
  )
  if (payload[LICENCE_TO_START_FIELD] === ANOTHER_DATE) {
    const day = payload['licence-start-date-day']
    const month = payload['licence-start-date-month']
    const year = payload['licence-start-date-year']

    const minDate = moment().tz(SERVICE_LOCAL_TIME).startOf('day').toDate()
    const maxDate = moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days').toDate()
    validateDate(day, month, year, minDate, maxDate)
  }
}

export const getErrorFlags = error => {
  const errorFlags = { isDayError: false, isMonthError: false, isYearError: false }
  const commonErrors = ['full-date', 'invalid-date', 'date-range', 'non-numeric']

  if (error) {
    const [errorKey] = Object.keys(error)

    if (['day-and-month', 'day-and-year', 'day', ...commonErrors].includes(errorKey)) {
      errorFlags.isDayError = true
    }
    if (['day-and-month', 'month-and-year', 'month', ...commonErrors].includes(errorKey)) {
      errorFlags.isMonthError = true
    }
    if (['day-and-year', 'month-and-year', 'year', ...commonErrors].includes(errorKey)) {
      errorFlags.isYearError = true
    }
  }

  return errorFlags
}
