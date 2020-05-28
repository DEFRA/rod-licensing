import Joi from '@hapi/joi'
import { v4 as uuidv4 } from 'uuid'

export const paymentJournalEntryParamsSchema = Joi.object({
  id: Joi.string()
    .min(1)
    .trim()
    .required()
    .description('The payment journal identifier')
    .example(uuidv4())
})

const paymentReferenceSchema = Joi.string()
  .min(1)
  .example(uuidv4())
const paymentTimestampSchema = Joi.string()
  .isoDate()
  .required()
  .description('An ISO8601 compatible date string defining when the payment was created')
  .example(new Date().toISOString())
const paymentStatusSchema = Joi.string()
  .valid('In Progress', 'Cancelled', 'Completed')
  .description('Payment status')

/**
 * Schema for the create payment journal request
 * @type {Joi.AnySchema}
 */
export const createPaymentJournalRequestSchema = Joi.object({
  paymentReference: paymentReferenceSchema.required(),
  paymentTimestamp: paymentTimestampSchema.required(),
  paymentStatus: paymentStatusSchema.required()
}).label('create-payment-journal-request')

/**
 * Schema for the update payment journal request
 * @type {Joi.AnySchema}
 */
export const updatePaymentJournalRequestSchema = Joi.object({
  paymentReference: paymentReferenceSchema.optional(),
  paymentTimestamp: paymentTimestampSchema.optional(),
  paymentStatus: paymentStatusSchema.optional()
})
  .or('paymentTimestamp', 'paymentReference', 'paymentStatus')
  .label('update-payment-journal-request')

export const paymentJournalResponseSchema = createPaymentJournalRequestSchema
  .append({
    id: Joi.string()
      .trim()
      .required()
      .example(uuidv4()),
    expires: Joi.number().required()
  })
  .label('payment-journal-response')

/**
 * Schema for the query endpoint request parameters
 * @type {Joi.AnySchema}
 */
export const paymentJournalQueryParams = Joi.object({
  paymentStatus: paymentStatusSchema,
  from: Joi.string()
    .isoDate()
    .required()
    .description('From date (inclusive)'),
  to: Joi.string()
    .isoDate()
    .required()
    .description('To date (inclusive)')
}).external(value => {
  if (value.from > value.to) {
    throw new Error('From date must not be after to date')
  }
})

export const paymentJournalQueryResponse = Joi.array()
  .items(paymentJournalResponseSchema)
  .label('payment-journal-query-response')
