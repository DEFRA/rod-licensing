import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'

export const recurringPaymentsResponseSchema = Joi.object({
  date: Joi.string()
  .isoDate()
  .required()
  .description('The ISO8601 compatible date for which recurring payments are being retrieved')
  .example(new Date().toISOString())
}).label('recurring-payments-request-params')
