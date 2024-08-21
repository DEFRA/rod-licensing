import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'

export const recurringPaymentsRequestParamsSchema = Joi.object({
  date: validation.date.isoDate().description('The date for which recurring payments are being retrieved')
}).label('recurring-payments-request-params')

const recurringPaymentSchema = Joi.object({
  id: Joi.string().required().description('The ID of the recurring payment'),
  amount: Joi.number().required().description('The payment amount of the recurring payment'),
  dueDate: validation.date.isoDate().description('The due date of the recurring payment'),
  status: Joi.string().valid('pending', 'paid', 'failed').required().description('The status of the payment')
}).label('recurring-payment')

export const recurringPaymentsResponseSchema = Joi.array()
  .items(recurringPaymentSchema)
  .label('recurring-payments-response')
