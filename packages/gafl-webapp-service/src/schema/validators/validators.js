import Joi from 'joi'
import moment from 'moment'
import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { dateSchema, dateSchemaInput } from '../date.schema.js'

const MAX_AGE = 120
const LICENCE_TO_START_FIELD = 'licence-to-start'
const AFTER_PAYMENT = 'after-payment'
const ANOTHER_DATE = 'another-date'
const DAY_SPECIFIC_ERRORS = ['day-and-month', 'day-and-year', 'day']
const MONTH_SPECIFIC_ERRORS = ['day-and-month', 'month-and-year', 'month']
const YEAR_SPECIFIC_ERRORS = ['day-and-year', 'month-and-year', 'year']
const DOB_FIELD_ERROR_PRIORITY = [
  'full-date',
  'day-and-month',
  'day-and-year',
  'month-and-year',
  'day',
  'month',
  'year',
  'non-numeric',
  'invalid-date'
]

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

export const renewalStartDateValidator = (payload, options) => {
  const { permission } = options.context.app.request
  const endDateMoment = moment.utc(permission.renewedEndDate).tz(SERVICE_LOCAL_TIME)
  const day = payload['licence-start-date-day']
  const month = payload['licence-start-date-month']
  const year = payload['licence-start-date-year']

  const minDate = endDateMoment.clone().startOf('day').toDate()
  const maxDate = endDateMoment.clone().add(ADVANCED_PURCHASE_MAX_DAYS, 'days').toDate()

  validateDate(day, month, year, minDate, maxDate)
}

export const getDateErrorFlags = error => {
  const errorFlags = { isDayError: false, isMonthError: false, isYearError: false }
  const commonErrors = ['full-date', 'invalid-date', 'date-range', 'non-numeric']
  const dayErrorKeys = new Set([...DAY_SPECIFIC_ERRORS, ...commonErrors])
  const monthErrorKeys = new Set([...MONTH_SPECIFIC_ERRORS, ...commonErrors])
  const yearErrorKeys = new Set([...YEAR_SPECIFIC_ERRORS, ...commonErrors])
  if (error) {
    const errorKeys = Object.keys(error)
    for (const errorKey of errorKeys) {
      if (dayErrorKeys.has(errorKey)) {
        errorFlags.isDayError = true
      }
      if (monthErrorKeys.has(errorKey)) {
        errorFlags.isMonthError = true
      }
      if (yearErrorKeys.has(errorKey)) {
        errorFlags.isYearError = true
      }
    }
  }
  return errorFlags
}

export const getDobErrorMessage = (error = {}, catalog) => {
  if (!catalog) {
    return undefined
  }

  const DATE_RANGE = 'date-range'
  const errorMap = {
    'full-date': {
      'object.missing': { text: catalog.dob_error }
    },
    'day-and-month': {
      'object.missing': { text: catalog.dob_error_missing_day_and_month }
    },
    'day-and-year': {
      'object.missing': { text: catalog.dob_error_missing_day_and_year }
    },
    'month-and-year': {
      'object.missing': { text: catalog.dob_error_missing_month_and_year }
    },
    day: {
      'any.required': { text: catalog.dob_error_missing_day }
    },
    month: {
      'any.required': { text: catalog.dob_error_missing_month }
    },
    year: {
      'any.required': { text: catalog.dob_error_missing_year }
    },
    'non-numeric': {
      'number.base': { text: catalog.dob_error_non_numeric }
    },
    'invalid-date': {
      'any.custom': { text: catalog.dob_error_date_real }
    },
    [DATE_RANGE]: {
      'date.min': { text: catalog.dob_error_year_min },
      'date.max': { text: catalog.dob_error_year_max }
    }
  }

  const errorTypes = [...DOB_FIELD_ERROR_PRIORITY.map(type => [type]), [DATE_RANGE, 'date.min'], [DATE_RANGE, 'date.max']]

  const found = errorTypes.find(([errType, errSubType]) => {
    if (errType === DATE_RANGE) {
      return error[errType] === errSubType && errorMap[errType]?.[errSubType]
    }
    return error[errType] && errorMap[errType]?.[error[errType]]
  })

  if (!found) {
    return undefined
  }

  const [foundType, foundSubType] = found
  if (foundType === DATE_RANGE) {
    return { text: errorMap[foundType]?.[foundSubType]?.text }
  }

  return { text: errorMap[foundType]?.[error[foundType]]?.text }
}
