import Joi from 'joi'
import { commonContactSchema } from './contact.schema.js'
import { finalisedPermissionSchemaContent } from './permission.schema.js'

export const dueRecurringPaymentsResponseSchema = Joi.object({
  id: Joi.string().guid().required(),
  name: Joi.string().required(),
  status: Joi.number().required(),
  nextDueDate: Joi.string().isoDate().required(),
  cancelledDate: Joi.string().isoDate().allow(null).required(),
  cancelledReason: Joi.string().allow(null).required(),
  endDate: Joi.string().isoDate().required(),
  agreementId: Joi.string().guid().required(),
  activePermission: Joi.string().guid().required(),
  contactId: Joi.string().guid().required(),
  publicId: Joi.string().required(),
  expanded: Joi.object({
    contact: { entity: commonContactSchema },
    activePermission: { entity: finalisedPermissionSchemaContent }
  })
})

export const dueRecurringPaymentsRequestParamsSchema = Joi.object({
  date: Joi.string().isoDate().required()
})

export const processRPResultRequestParamsSchema = Joi.object({
  transactionId: Joi.string().required(),
  paymentId: Joi.string().required(),
  createdDate: Joi.string().isoDate().required()
})

export const cancelRecurringPaymentRequestParamsSchema = Joi.object({
  id: Joi.string().required()
})

export const cancelRecurringPaymentRequestQuerySchema = Joi.object({
  reason: Joi.string().required().valid('Payment Failure', 'User Cancelled')
})
