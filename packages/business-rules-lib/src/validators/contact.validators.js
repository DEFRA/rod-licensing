import moment from 'moment'

/**
 * Convert the string to use titlecase at each word boundary
 *
 * @param {Array<String>} exclusions Define a set of words which will not be converted
 * @returns {function(*=): *|string}
 */
const toTitleCase = (exclusions = []) => {
  const exclusionsRegex = exclusions.map(e => `${e}\\P{L}`).join('|')
  const capitalisationExclusionLookahead = exclusions.length ? `(?!${exclusionsRegex})` : ''
  const regex = new RegExp(`(?:^|\\P{L})${capitalisationExclusionLookahead}\\p{L}`, 'gu')
  return value => value && value.toLowerCase().replace(regex, match => match.toUpperCase())
}

/**
 * Capitalises special name prefixes - e.g. mcdonald => McDonald
 *
 * @param {Array<String>} prefixes Prefixes to be handled - e.g. ['Mc']
 * @returns {function(*=): *|string}
 */
const capitaliseNamePrefixes = prefixes => {
  const regex = new RegExp(`(?:^|[^\\p{L}])(${prefixes.join('|')})(\\p{L})`, 'gui')
  const titleCaseFn = toTitleCase([])
  return value => value && value.replace(regex, (match, g1, g2) => `${titleCaseFn(g1)}${g2.toUpperCase()}`)
}

const dateStringFormats = ['YYYY-MM-DD', 'YY-MM-DD', 'YYYY-M-DD', 'YY-M-DD', 'YYYY-MM-D', 'YY-MM-D', 'YYYY-M-D', 'YY-M-D']

/**
 * Create a validator to check a contact's birth date
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.AnySchema}
 */
const createDateStringValidator = joi =>
  joi.string().extend({
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

      return { value }
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

/**
 * Create a validator to check a contact's birth date
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.AnySchema}
 */
export const createBirthDateValidator = joi =>
  createDateStringValidator(joi)
    .trim()
    .birthDate(120)
    .required()
    .example('2000-01-01')

/**
 * Create a validator to check a contact's mobile phone number
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createEmailValidator = joi =>
  joi
    .string()
    .trim()
    .email()
    .max(100)
    .lowercase()
    .example('person@example.com')

export const mobilePhoneRegex = /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
/**
 * Create a validator to check a contact's mobile phone number
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createMobilePhoneValidator = joi =>
  joi
    .string()
    .trim()
    .pattern(mobilePhoneRegex)
    .example('+44 7700 900088')

/**
 * Create a validator to check a contact's address premises
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createPremisesValidator = joi =>
  joi
    .string()
    .trim()
    .min(1)
    .max(100)
    .external(toTitleCase())
    .required()
    .example('Example House')

/**
 * Create a validator to check a contact's address street
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createStreetValidator = joi =>
  joi
    .string()
    .trim()
    .max(100)
    .external(toTitleCase())
    .empty('')
    .example('Example Street')

/**
 * Create a validator to check a contact's address locality
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createLocalityValidator = joi =>
  joi
    .string()
    .trim()
    .max(100)
    .external(toTitleCase())
    .empty('')
    .example('Near Sample')

/**
 * Create a validator to check a contact's address town
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createTownValidator = joi =>
  joi
    .string()
    .trim()
    .max(100)
    .external(toTitleCase(['under', 'upon', 'in', 'on', 'cum', 'next', 'the', 'en', 'le', 'super']))
    .required()
    .example('Exampleton')

export const ukPostcodeRegex = /^([A-PR-UWYZ][0-9]{1,2}[A-HJKPSTUW]?|[A-PR-UWYZ][A-HK-Y][0-9]{1,2}[ABEHMNPRVWXY]?)\s{0,6}([0-9][A-Z]{2})$/i

/**
 * Create a validator to check a contact's postcode
 *
 * Will automatically correct spacing for UK postcodes
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createUKPostcodeValidator = joi =>
  joi
    .string()
    .trim()
    .min(1)
    .max(12)
    .required()
    .pattern(ukPostcodeRegex)
    .replace(ukPostcodeRegex, '$1 $2')
    .uppercase()
    .example('AB12 3CD')

/**
 * Create a validator to check/format overseas postcodes
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createOverseasPostcodeValidator = joi =>
  joi
    .string()
    .trim()
    .min(1)
    .uppercase()
    .required()

const regexApostrophe = /\u2019/g
const regexHyphen = /\u2014/g
const regexMultiSpace = /\u0020{2,}/g

const substitutes = txt =>
  txt
    .replace(regexApostrophe, '\u0027')
    .replace(regexHyphen, '\u2010')
    .replace(regexMultiSpace, '\u0020')

/**
 * Regular expression used to validate firstname and lastname fields
 * @type {RegExp}
 */
const nameStringRegex = /^\p{L}+(?:(?:\.?\s|[-'\s])\p{L}+)*$/u

/**
 * Create a custom validator extension to check names
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.AnySchema}
 */
const createNameStringValidator = joi =>
  joi.string().extend({
    type: 'name',
    coerce (value) {
      return { value: substitutes(value) }
    },
    rules: {
      allowable: {
        validate (value, helpers) {
          if (!nameStringRegex.test(value)) {
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

/**
 * Create a validator to check a contact's first name
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @param {number} minimumLength allow the default minimum allowed length to be overridden
 * @returns {Joi.AnySchema}
 */
export const createFirstNameValidator = (joi, { minimumLength = 2 } = {}) =>
  createNameStringValidator(joi)
    .allowable()
    .min(minimumLength)
    .max(100)
    .trim()
    .external(toTitleCase())
    .required()
    .example('Fester')

/**
 * Create a validator to check a contact's last name
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @param {number} minimumLength allow the default minimum allowed length to be overridden
 * @returns {Joi.AnySchema}
 */
export const createLastNameValidator = (joi, { minimumLength = 2 } = {}) =>
  createNameStringValidator(joi)
    .allowable()
    .min(minimumLength)
    .max(100)
    .trim()
    .external(toTitleCase(['van', 'de', 'der', 'den']))
    .external(capitaliseNamePrefixes(['Mc', "O'"]))
    .required()
    .example('Tester')

/**
 * Create a validator to check a valid national insurance number
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.AnySchema}
 */

const ukNINORegEx = /^([ABCEGHJ-PRSTW-Z][ABCEGHJ-NPRSTW-Z])(?<!(?:BG|GB|KN|NK|NT|TN|ZZ))\s?([0-9]{2})\s{0,3}([0-9]{2})\s{0,3}([0-9]{2})\s{0,3}([ABCD])$/

export const createNationalInsuranceNumberValidator = joi =>
  joi
    .string()
    .trim()
    .uppercase()
    .pattern(ukNINORegEx)
    .replace(ukNINORegEx, '$1 $2 $3 $4 $5')
    .required()
    .description('A UK national insurance number')
    .example('NH 12 34 56 A')
