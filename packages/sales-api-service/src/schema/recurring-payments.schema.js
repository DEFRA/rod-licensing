import Joi from 'joi'

export const recurringPaymentsSchema = Joi.object({
  date: Joi.string()
    .isoDate()
    .required()
    .description('An ISO8601 compatible date string defining what date to retrieve recurring payments for')
    .example(new Date().toISOString())
})
