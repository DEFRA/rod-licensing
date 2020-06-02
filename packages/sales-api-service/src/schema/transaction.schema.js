import Joi from '@hapi/joi'
import { PoclFile } from '@defra-fish/dynamics-lib'
import { createPermissionSchema, createPermissionResponseSchema } from './permission.schema.js'
import { contactSchema } from './contact.schema.js'
import { createAlternateKeyValidator, buildJoiOptionSetValidator } from './validators/validators.js'
import { MAX_PERMISSIONS_PER_TRANSACTION } from '@defra-fish/business-rules-lib'

import { v4 as uuidv4 } from 'uuid'

/**
 * Maximum number of items that can be created in a batch - limited by DynamoDB max batch size
 * @type {number}
 */
export const BATCH_CREATE_MAX_COUNT = 25

/**
 * Schema for the create transaction request
 * @type {Joi.AnySchema}
 */
export const createTransactionSchema = Joi.object({
  permissions: Joi.array()
    .min(1)
    .max(MAX_PERMISSIONS_PER_TRANSACTION)
    .items(createPermissionSchema)
    .required()
    .label('create-transaction-request-permissions'),
  dataSource: buildJoiOptionSetValidator('defra_datasource', 'Web Sales')
}).label('create-transaction-request')

/**
 * Validates a request to create transactions in batch.
 * Does not reference the createTransactionSchema as validation of objects in the array is applied manually in the request handler
 * so that a batch response can be formed (otherwise the entire batch will fail if any one of the create-requests contains a validation error)
 * @type {Joi.AnySchema}
 */
export const createTransactionBatchSchema = Joi.array()
  .min(1)
  .max(BATCH_CREATE_MAX_COUNT)
  .items(
    Joi.object()
      .required()
      .description('See create-transaction-request for proper structure')
  )
  .required()
  .label('create-transaction-batch-request')

/**
 * Schema for the create transaction response
 * @type {Joi.AnySchema}
 */
export const createTransactionResponseSchema = Joi.object({
  id: Joi.string()
    .trim()
    .guid()
    .required(),
  expires: Joi.number().required(),
  permissions: Joi.array()
    .min(1)
    .items(createPermissionResponseSchema)
    .required()
    .label('create-transaction-response-permissions'),
  dataSource: buildJoiOptionSetValidator('defra_datasource', 'Web Sales'),
  cost: Joi.number().required(),
  isRecurringPaymentSupported: Joi.boolean().required()
}).label('create-transaction-response')

/**
 * Schema for the create transaction batch response
 * @type {Joi.AnySchema}
 */
export const createTransactionBatchResponseSchema = Joi.array()
  .items(
    Joi.object({
      statusCode: Joi.number().required(),
      response: createTransactionResponseSchema.optional(),
      error: Joi.string().optional(),
      message: Joi.string().optional()
    }).label('create-transaction-batch-response-item')
  )
  .label('create-transaction-batch-response')

/**
 * Schema for the finalise transaction request
 * @type {Joi.AnySchema}
 */
export const finaliseTransactionRequestSchema = Joi.object({
  transactionFile: Joi.string()
    .optional()
    .external(createAlternateKeyValidator(PoclFile)),
  payment: Joi.object({
    amount: Joi.number().required(),
    timestamp: Joi.string()
      .isoDate()
      .required()
      .description('An ISO8601 compatible date string defining when the transaction was completed')
      .example(new Date().toISOString()),
    source: buildJoiOptionSetValidator('defra_financialtransactionsource', 'Gov Pay'),
    channelId: Joi.string()
      .trim()
      .optional()
      .description('Channel specific identifier'),
    method: buildJoiOptionSetValidator('defra_paymenttype', 'Debit card'),
    recurring: Joi.object({
      payer: contactSchema,
      referenceNumber: Joi.string()
        .required()
        .description('The reference number associated with the recurring payment')
        .example(uuidv4()),
      mandate: Joi.string()
        .required()
        .description('The mandate identifier associated with the recurring payment')
        .example(uuidv4())
    })
      .label('finalise-transaction-recurring-payment-details')
      .description('Used to establish a recurring payment (e.g. via Direct Debit)')
      .optional()
  })
    .label('finalise-transaction-payment-details')
    .required()
}).label('finalise-transaction-request')

export const finaliseTransactionResponseSchema = Joi.object({
  messageId: Joi.string().required(),
  status: Joi.string().required()
}).label('finalise-transaction-response')
