import Joi from 'joi'

export const mobilePhoneRegex = /^((\+44)(\s?)|(0))(7\d{3})(\s?)(\d{3})(\s?)(\d{3})$/
export const mobilePhoneValidator = Joi.string()
  .trim()
  .pattern(mobilePhoneRegex)
  .replace(mobilePhoneRegex, '$2$4$5$7$9')
  .example('+44 7700 900088')
