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
  .max(50)
  .example('person@example.com')

export const mobilePhoneRegex = /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
export const mobilePhoneValidator = Joi.string()
  .trim()
  .pattern(mobilePhoneRegex)
  .example('+44 7700 900088')

/*
 * The standard DEFRA address components
 */
export const premisesValidator = Joi.string()
  .trim()
  .required()
  .uppercase()
  .max(50)

export const streetValidator = Joi.string()
  .max(50)
  .trim()
  .uppercase()
  .empty('')

export const localityValidator = Joi.string()
  .max(50)
  .trim()
  .uppercase()
  .empty('')

export const townValidator = Joi.string()
  .max(50)
  .trim()
  .uppercase()
  .required()

export const ukPostcodeRegex = /^([A-PR-UWYZ][0-9]{1,2}[A-HJKPSTUW]?|[A-PR-UWYZ][A-HK-Y][0-9]{1,2}[ABEHMNPRVWXY]?)\s*([0-9][A-Z]{2})$/i
export const ukPostcodeValidator = Joi.string()
  .trim()
  .min(1)
  .required()
  .pattern(ukPostcodeRegex)
  .replace(ukPostcodeRegex, '$1 $2')
  .uppercase()
  .example('AB12 3CD')

const regexApostrophe = /\u2019/g
const regexHyphen = /\u2014/g
const regexMultiSpace = /\u0020{2,}/g

const substitutes = txt =>
  txt
    .replace(regexApostrophe, '\u0027')
    .replace(regexHyphen, '\u2010')
    .replace(regexMultiSpace, '\u0020')

const nameString = Joi.string().extend({
  type: 'name',
  coerce (value) {
    return { value: substitutes(value) }
  },
  rules: {
    allowable: {
      validate (value, helpers) {
        if (
          !/^[A-Za-z\u0020\u0027\u002c\u002d\u002e\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff\u0100-\u017f\u0180-\u01ff\u0200-\u024f\u0250-\u02af\u0370-\u0fff]+$/g.test(
            value
          )
        ) {
          return helpers.error('string.forbidden')
        }
        return value
      }
    }
  },
  messages: {
    'string.forbidden': '{{#label}} contains forbidden characters'
  }
})

export const firstNameValidator = nameString
  .allowable()
  .min(2)
  .max(100)
  .trim()
  .uppercase()
  .required()

export const lastNameValidator = nameString
  .allowable()
  .min(2)
  .max(100)
  .trim()
  .uppercase()
  .required()
