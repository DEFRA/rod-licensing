import Joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import { commonContactSchema } from './contact.schema.js'
import { optionSetOption } from './option-set.schema.js'
import { concessionProofSchema } from './concession-proof.schema.js'
import { buildJoiOptionSetValidator, createAlternateKeyValidator } from './validators/validators.js'
import { PoclFile, PoclStagingException } from '@defra-fish/dynamics-lib'

const dateSchema = Joi.string().isoDate().required().example(new Date().toISOString())

const TRANSACTION_DATE = dateSchema.description('An ISO8601 compatible date string defining when the transaction was completed')

const schemaObject = {
  stagingException: Joi.object({
    stagingId: Joi.string().required(),
    description: Joi.string().required(),
    transactionJson: Joi.string().required(),
    exceptionJson: Joi.string().required()
  }),
  transactionFileException: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    json: Joi.string().required(),
    notes: Joi.string(),
    type: buildJoiOptionSetValidator(PoclStagingException.definition.mappings.type.ref, 'Failure'),
    transactionFile: Joi.string().external(createAlternateKeyValidator(PoclFile)).required(),
    permissionId: Joi.string()
  }),
  record: Joi.object({
    id: Joi.string(),
    createTransactionPayload: Joi.object({
      dataSource: Joi.string(),
      journalId: Joi.string().optional(),
      serialNumber: Joi.string(),
      permissions: Joi.array()
    }),
    finaliseTransactionPayload: Joi.object({
      payment: Joi.object({
        timestamp: Joi.string(),
        amount: Joi.number(),
        source: Joi.string(),
        channelId: Joi.string(),
        method: Joi.string()
      })
    }),
    stage: Joi.string(),
    createTransactionError: Joi.object({
      statusCode: Joi.number(),
      error: Joi.string(),
      message: Joi.string()
    })
  }).optional()
}

/**
 * Schema for the create staging exception request
 * @type {Joi.AnySchema}
 */
export const createStagingExceptionRequestSchema = Joi.object(schemaObject)
  .or('stagingException', 'transactionFileException')
  .label('create-staging-exception-request')

/**
 * Schema for the get pocl data validation errors response
 * @type {Joi.AnySchema}
 */
export const createStagingExceptionResponseSchema = Joi.object(schemaObject).label('create-staging-exception-response')

export const poclValidationErrorItemSchema = Joi.object({
  ...commonContactSchema,
  country: optionSetOption,
  preferredMethodOfConfirmation: optionSetOption,
  preferredMethodOfNewsletter: optionSetOption,
  preferredMethodOfReminder: optionSetOption,
  postalFulfilment: Joi.boolean().required(),
  concessions: concessionProofSchema.optional(),
  startDate: dateSchema.description('An ISO8601 compatible date string defining when the permission commences'),
  newStartDate: dateSchema.description('An ISO8601 compatible date string defining when the permission commences'),
  serialNumber: Joi.string().trim().required(),
  transactionFile: Joi.string().trim().required(),
  permitId: Joi.string().guid().required(),
  amount: Joi.number().required(),
  transactionDate: TRANSACTION_DATE,
  paymentSource: Joi.string().trim().required(),
  newPaymentSource: buildJoiOptionSetValidator('defra_financialtransactionsource', 'Direct Debit'),
  channelId: Joi.string().trim().required().description('Channel specific identifier'),
  methodOfPayment: buildJoiOptionSetValidator('defra_paymenttype', 'Debit card'),
  dataSource: buildJoiOptionSetValidator('defra_datasource', 'DDE File'),
  status: buildJoiOptionSetValidator('defra_status', 'Ready for Processing'),
  stateCode: Joi.number().required()
}).label('pocl-validation-error-item')

export const poclValidationErrorListSchema = Joi.array().items(poclValidationErrorItemSchema).label('pocl-validation-error-item-list')

export const poclValidationErrorParamsSchema = Joi.object({
  id: Joi.string().trim().guid().required().description('The POCL validation error identifier').example(uuidv4())
})

// There may be further issues in the record data at this point
export const updatePoclValidationErrorPayload = Joi.object({
  poclValidationErrorId: Joi.string().trim().guid().required().description('The POCL validation error identifier').example(uuidv4()),
  createTransactionPayload: {
    dataSource: Joi.string().optional(),
    journalId: Joi.string().optional(),
    serialNumber: Joi.string().trim().required(),
    permissions: Joi.array().items(
      Joi.object({
        licensee: Joi.object(),
        issueDate: TRANSACTION_DATE,
        startDate: dateSchema.description('An ISO8601 compatible date string defining when the permission commences'),
        // newStartDate: dateSchema.description('An ISO8601 compatible date string defining when the permission commences'),
        permitId: Joi.string().guid().required(),
        concessions: Joi.array()
          .items(
            Joi.object({
              id: Joi.string().guid().required().example(uuidv4()),
              proof: Joi.object({
                type: Joi.string().required(),
                referenceNumber: Joi.string().optional().example('QQ 12 34 56 C')
              }).required()
            })
          )
          .optional()
      })
    )
  },
  finaliseTransactionPayload: {
    transactionFile: Joi.string().optional(),
    payment: {
      timestamp: TRANSACTION_DATE,
      amount: Joi.number().required(),
      source: Joi.string().trim().required(),
      channelId: Joi.string().trim().optional().description('Channel specific identifier'),
      method: Joi.string().trim().required()
    }
  },
  createTransactionError: Joi.object().optional(),
  status: Joi.string().optional(),
  errorMessage: Joi.string().optional()
}).required()
