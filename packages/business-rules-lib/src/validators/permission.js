import Joi from '@hapi/joi'

export const permissionNumberValidator = Joi.string()
  .trim()
  .pattern(/^\d{8}-\d[A-Z]{2}\d[A-Z]{3}-[A-F0-9]{6}$/)
  .required()
  .description('The permission reference number')
  .example('00310321-2DC3FAS-F4A315')
