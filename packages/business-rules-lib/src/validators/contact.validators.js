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

const dateStringFormats = ['YYYY-MM-DD', 'YYYY-M-DD', 'YYYY-MM-D', 'YYYY-M-D']

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
      'date.max': '{{#label}} must be less than or equal to "now"',
      'date.dayMissing': 'Day is missing',
      'date.dayMonthMissing': 'Enter the date of birth',
      'date.dayYearMissing': 'Enter the date of birth',
      'date.monthMissing': 'Month is missing',
      'date.monthYearMissing': 'Enter the date of birth',
      'date.yearMissing': 'Year is missing',
      'date.allMissing': 'Enter the date of birth'
    },
    validate (value, helpers) {
      const dateValue = moment(value, dateStringFormats, true)
      if (!dateValue.isValid()) {
        const parts = value.split('-')
        const [year, month, day] = parts

        if (!day && month && year) {
          return { value, errors: helpers.error('date.dayMissing') }
        }
        if (!day && !month && year) {
          return { value, errors: helpers.error('date.dayMonthMissing') }
        }
        if (!day && month && !year) {
          return { value, errors: helpers.error('date.dayYearMissing') }
        }
        if (day && !month && year) {
          return { value, errors: helpers.error('date.monthMissing') }
        }
        if (day && !month && !year) {
          return { value, errors: helpers.error('date.monthYearMissing') }
        }
        if (day && month && !year) {
          return { value, errors: helpers.error('date.yearMissing') }
        }
        if (!day && !month && !year) {
          return { value, errors: helpers.error('date.allMissing') }
        }

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
export const createBirthDateValidator = joi => createDateStringValidator(joi).trim().birthDate(120).required().example('2000-01-01')

/**
 * Create a validator to check a contact's mobile phone number
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createEmailValidator = joi => joi.string().trim().email().max(100).lowercase().example('person@example.com')

export const mobilePhoneRegex = /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/
/**
 * Create a validator to check a contact's mobile phone number
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createMobilePhoneValidator = joi => joi.string().trim().pattern(mobilePhoneRegex).example('+44 7700 900088')

/**
 * Create a validator to check a contact's address premises
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createPremisesValidator = joi => joi.string().trim().min(1).max(50).external(toTitleCase()).required().example('Example House')

/**
 * Create a validator to check a contact's address street
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createStreetValidator = joi => joi.string().trim().max(100).external(toTitleCase()).empty('').example('Example Street')

/**
 * Create a validator to check a contact's address locality
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createLocalityValidator = joi => joi.string().trim().max(100).external(toTitleCase()).empty('').example('Near Sample')

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
export const overseasPostcodeRegex = /^([a-zA-Z0-9 ]{1,12})$/i

/**
 * Create a validator to check a contact's postcode
 *
 * Will automatically correct spacing for UK postcodes
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createUKPostcodeValidator = joi =>
  joi.string().trim().min(1).max(12).required().pattern(ukPostcodeRegex).replace(ukPostcodeRegex, '$1 $2').uppercase().example('AB12 3CD')

/**
 * Create a validator to check/format overseas postcodes
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.StringSchema}
 */
export const createOverseasPostcodeValidator = joi =>
  joi.string().trim().min(1).max(12).uppercase().required().pattern(overseasPostcodeRegex)

const nameStringSubstitutions = [
  /*
    hyphen-minus U+002D (included here to remove surrounding spacing)
    hyphen U+2010
    non-breaking hyphen U+2011
    figure dash U+2012
    en dash U+2013
    em dash U+2014
    horizontal bar U+2015
    hyphen bullet U+2043
    swung dash U+2053
    minus sign U+2212
   */
  { replacement: '\u002d', regex: '\\s*[\u002d\u2010\u2011\u2012\u2013\u2014\u2015\u2053\u2212]\\s*' },
  /*
    apostrophe U+0027 (included here to remove surrounding spacing)
    backtick / grave accent U+0060
    acute accent U+00B4
    left single quotation mark U+2018
    right single quotation mark U+2019
    prime U+2032
    reversed prime U+2035
    hebrew punctuation geresh U+05F3
    heavy single comma quotation mark ornament U+275C
    latin small letter saltillo U+A78C
    fullwidth apostrophe U+FF07
   */
  { replacement: '\u0027', regex: '\\s*[\u0027\u0060\u00B4\u2018\u2019\u2032\u2035\u05F3\u275C\uA78C\uFF07]\\s*' },
  /*
    comma U+002C
    full stop U+002E
    no-break space U+00A0
    zero width space U+200B
    narrow no-break space U+202F
    word joiner U+2060
    ideographic space U+3000
    zero width no-break space U+FEFF
   */

  { replacement: ' ', regex: '\\s*[\u002c\u002e\u00a0\u200b\u202f\u2060\u3000\ufeff]\\s*' },
  // brackets with improper spacing
  { replacement: '(', regex: '\\(\\s+' },
  { replacement: ')', regex: '\\s+\\)' }
]
const nameStringSubstitutionRegex = new RegExp(nameStringSubstitutions.map(s => `(${s.regex})`).join('|'), 'g')

/**
 * Substitutes characters with their designated standard replacement
 *
 * @param {string} value The string in which to search for substitutions
 * @returns {string} The substituted string
 */
export const standardiseName = value =>
  String(value)
    .replace(nameStringSubstitutionRegex, (match, ...groups) => {
      // Find the first group which is matched (not returned as undefined)  This will be the index of the matched rule.
      const matchPos = groups.findIndex(g => g !== undefined)
      return nameStringSubstitutions[matchPos].replacement
    })
    .replace(/\s+/g, ' ')
    .trim()

// Regular expression component for validating a term within a name.  Allows a alpha sequence or an alpha sequence surrounding by brackets
const nameTermRegex = '(?:\\p{L}+|\\(\\p{L}+\\))'
/**
 * Regular expression used to validate firstname and lastname fields
 * @type {RegExp}
 */
const nameStringRegex = new RegExp(`^${nameTermRegex}(?:[-'\\s]${nameTermRegex})*$`, 'u')

/**
 * Create a custom validator extension to check names
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @returns {Joi.AnySchema}
 */
const createNameStringValidator = (joi, { minimumLength }) =>
  joi.string().extend({
    type: 'name',
    rules: {
      allowable: {
        validate (value, helpers) {
          const alphaCharacters = value.replace(/\P{L}/gu, '')
          if (alphaCharacters.length < minimumLength) {
            return helpers.error('string.min')
          }
          value = standardiseName(value)
          if (!nameStringRegex.test(value)) {
            return helpers.error('string.forbidden')
          }
          return value
        }
      }
    },
    messages: {
      'string.min': `{{#label}} must contain at least ${minimumLength} alpha characters`,
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
  createNameStringValidator(joi, { minimumLength }).allowable().max(100).trim().external(toTitleCase()).required().example('Fester')

/**
 * Create a validator to check a contact's last name
 *
 * @param {Joi.Root} joi the joi validator used by the consuming project
 * @param {number} minimumLength allow the default minimum allowed length to be overridden
 * @returns {Joi.AnySchema}
 */
export const createLastNameValidator = (joi, { minimumLength = 2 } = {}) =>
  createNameStringValidator(joi, { minimumLength })
    .allowable()
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

const ukNINORegEx =
  /^([ABCEGHJ-PRSTW-Z][ABCEGHJ-NPRSTW-Z])(?<!(?:BG|GB|KN|NK|NT|TN|ZZ))\s?([0-9]{2})\s{0,3}([0-9]{2})\s{0,3}([0-9]{2})\s{0,3}([ABCD])$/

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
