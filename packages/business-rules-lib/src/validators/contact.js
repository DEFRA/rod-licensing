import Joi from '@hapi/joi'
import moment from 'moment'

export const birthDateValidator = Joi.string()
  .trim()
  .external(birthDateString => {
    const birthDate = moment(birthDateString, 'YYYY-MM-DD', true)
    if (!birthDate.isValid()) {
      throw new Error('birthDate must be in the format YYYY-MM-DD')
    }
    if (!birthDate.isBefore(moment().startOf('day'))) {
      throw new Error('birthDate cannot be in the future')
    }
  })
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
