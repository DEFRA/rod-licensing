import Joi from '@hapi/joi'
import moment from 'moment'

const dateStringFormats = ['YYYY-MM-DD', 'YY-MM-DD', 'YYYY-M-DD', 'YY-M-DD', 'YYYY-MM-D', 'YY-MM-D', 'YYYY-M-D', 'YY-M-D']

const dateString = Joi.string().extend({
  type: 'birthDate',
  messages: {
    'date.format': '{{#label}} must be in [YYYY-MM-DD] format',
    'date.min': '{{#label}} date before minimum allowed',
    'date.max': '{{#label}} must be less than or equal to "now"'
  },
  validate (value, helpers) {
    const dateValue = moment(value, dateStringFormats, true)
    if (!dateValue.isValid()) {
      return { value, errors: helpers.error('date.format') }
    }
  },
  rules: {
    birthDate: {
      args: [
        {
          name: 'maxAge',
          ref: false,
          assert: value => typeof value === 'number' && !isNaN(value),
          message: 'maxAge must be a number'
        }
      ],
      method (maxAge) {
        return this.$_addRule({ name: 'birthDate', args: { maxAge } })
      },
      validate (value, helpers, args) {
        const birthDate = moment(value, dateStringFormats, true)
        if (!birthDate.isBefore(moment().startOf('day'))) {
          return helpers.error('date.max')
        }

        if (birthDate.isBefore(moment().subtract(args.maxAge, 'years'))) {
          return helpers.error('date.min')
        }

        return birthDate.format('YYYY-MM-DD')
      }
    }
  }
})

export const birthDateValidator = dateString
  .trim()
  .birthDate(120)
  .required()
  .example('2000-01-01')

export const emailValidator = Joi.string()
  .trim()
  .email()
  .example('person@example.com')

export const mobilePhoneRegex = /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
export const mobilePhoneValidator = Joi.string()
  .trim()
  .pattern(mobilePhoneRegex)
  .example('+44 7700 900088')

export const ukPostcodeRegex = /^([A-PR-UWYZ][0-9]{1,2}[A-HJKPSTUW]?|[A-PR-UWYZ][A-HK-Y][0-9]{1,2}[ABEHMNPRVWXY]?)\s*([0-9][A-Z]{2})$/i
/**
 * Validates a contact postcode.  This validator will apply appropriate formatting to UK postcodes
 */
export const postcodeValidator = Joi.string()
  .trim()
  .min(1)
  .external(postcode => {
    const pcChars = postcode.replace(/\s/g, '')
    const matches = pcChars.match(ukPostcodeRegex)
    if (matches) {
      postcode = `${matches[1]} ${matches[2]}`.toUpperCase()
    }
    return postcode
  })
  .required()
  .example('AB12 3CD')
