import moment from 'moment-timezone'
import { dateMissing, licenceStartDateValid, dateNotNumber } from './date.validators.js'
import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '../constants.js'

/**
 * Validate a permission reference number.
 *
 * NOTE: This has been deliberately kept loose to allow for old-style licence numbers which used hex format for the last section
 *
 * @param joi
 * @returns {this}
 */
export const createPermissionNumberValidator = joi =>
  joi
    .string()
    .trim()
    .uppercase()
    .pattern(/^\d{8}-\d[A-Z]{2}\d[A-Z]{3}-[A-Z0-9]{6}$/)
    .required()
    .description('The permission reference number')
    .example('17030621-3WC3FFT-B6HLG9')

/**
 * Validate the last section of the permission reference number.
 *
 * NOTE: This has been deliberately kept loose to allow for old-style licence numbers which used hex format for the last section
 *
 * @param joi
 * @returns {this}
 */
export const permissionNumberUniqueComponentValidator = joi =>
  joi
    .string()
    .trim()
    .uppercase()
    .pattern(/^[A-Z0-9]{6}$/)
    .required()
    .description('The unique part of the permission reference number')
    .example('B6HLG9')

const dateStringFormats = ['YYYY-MM-DD', 'YY-MM-DD', 'YYYY-M-DD', 'YY-M-DD', 'YYYY-MM-D', 'YY-MM-D', 'YYYY-M-D', 'YY-M-D']

/**
 * Create a validator to check a licence start date
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.AnySchema}
 */
const createLicenceDateStringValidator = joi =>
  joi.string().extend({
    type: 'licenceStartDate',
    messages: {
      'date.min': '{{#label}} date before minimum allowed',
      'date.max': '{{#label}} date after maximum allowed',
      'date.dayInvalid': '{{#label}} must be a real date',
      'date.dayMonthInvalid': '{{#label}} must be a real date',
      'date.monthInvalid': '{{#label}} must be a real date',
      'date.dayNotNumber': 'Enter only numbers',
      'date.dayMonthNotNumber': 'Enter only numbers',
      'date.dayYearNotNumber': 'Enter only numbers',
      'date.monthNotNumber': 'Enter only numbers',
      'date.monthYearNotNumber': 'Enter only numbers',
      'date.yearNotNumber': 'Enter only numbers',
      'date.allNotNumber': 'Enter only numbers',
      'date.dayMissing': 'Day is missing',
      'date.dayMonthMissing': 'Enter a licence start date',
      'date.dayYearMissing': 'Enter a licence start date',
      'date.monthMissing': 'Month is missing',
      'date.monthYearMissing': 'Enter a licence start date',
      'date.yearMissing': 'Year is missing',
      'date.allMissing': 'Enter a licence start date'
    },
    validate (value, helpers) {
      const dateValue = moment(value, dateStringFormats, true)

      if (!dateValue.isValid()) {
        const parts = value.split('-')
        const [year, month, day] = parts

        const dateIsMissing = dateMissing(day, month, year, value, helpers)
        if (dateIsMissing) {
          return dateIsMissing
        }
        const dateIsNotNumber = dateNotNumber(day, month, year, value, helpers)
        if (dateIsNotNumber) {
          return dateIsNotNumber
        }

        const dateIsInvalid = licenceStartDateValid(day, month, year, value, helpers)
        if (dateIsInvalid) {
          return dateIsInvalid
        }
      }

      return { value }
    },
    rules: {
      licenceStartDate: {
        validate (value, helpers) {
          const licenceStartDate = moment(value, dateStringFormats, true)

          if (licenceStartDate.isBefore(moment().tz(SERVICE_LOCAL_TIME).startOf('day'))) {
            return helpers.error('date.min')
          }

          const maxDate = moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days')
          if (licenceStartDate.isAfter(maxDate)) {
            return helpers.error('date.max')
          }

          return licenceStartDate.format('YYYY-MM-DD')
        }
      }
    }
  })

/**
 * Create a validator to check a licence start date
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.AnySchema}
 */
export const createLicenceStartDateValidator = joi => createLicenceDateStringValidator(joi).trim().licenceStartDate(120).required().example('2000-01-01')
