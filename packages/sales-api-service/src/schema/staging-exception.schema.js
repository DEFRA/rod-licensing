import Joi from 'joi'
import { v4 as uuidv4 } from 'uuid'
import { commonContactSchema } from './contact.schema.js'
import { optionSetOption } from './option-set.schema.js'
import { concessionProofSchema } from './concession-proof.schema.js'
import { buildJoiOptionSetValidator, createAlternateKeyValidator } from './validators/validators.js'
import { PoclFile, PoclStagingException } from '@defra-fish/dynamics-lib'

const dateSchema = Joi.string()
  .isoDate()
  .required()
  .example(new Date().toISOString())

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
    transactionFile: Joi.string()
      .external(createAlternateKeyValidator(PoclFile))
      .required(),
    permissionId: Joi.string()
  }),
  record: Joi.object({
    id: Joi.string(),
    createTransactionPayload: Joi.object({
      dataSource: Joi.string(),
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
  concessions: concessionProofSchema.optional(),
  startDate: dateSchema.description('An ISO8601 compatible date string defining when the permission commences'),
  serialNumber: Joi.string().trim().required(),
  permitId: Joi.string().guid().required(),
  amount: Joi.number().required(),
  transactionDate: dateSchema.description('An ISO8601 compatible date string defining when the transaction was completed'),
  paymentSource: Joi.string()
    .trim()
    .required(),
  channelId: Joi.string()
    .trim()
    .required()
    .description('Channel specific identifier'),
  methodOfPayment: buildJoiOptionSetValidator('defra_paymenttype', 'Debit card'),
  dataSource: buildJoiOptionSetValidator('defra_datasource', 'Post Office Sales'),
  status: buildJoiOptionSetValidator('defra_status', 'Ready for Processing'),
  activeStatus: Joi.object({
    id: Joi.number.required(),
    description: Joi.string().allow('Active', 'Inactive').required(),
    label: Joi.string().allow('Active', 'Inactive').required()
  }).required()
})
  .label('pocl-data-validation-error-item')

export const poclValidationErrorListSchema = Joi.array()
  .items(poclValidationErrorItemSchema)
  .label('pocl-data-validation-error-item-list')

export const poclValidationErrorParamsSchema = Joi.object({
  id: Joi.string()
    .trim()
    .guid()
    .required()
    .description('The POCL validation error identifier')
    .example(uuidv4())
})

export const updatePoclValidationErrorPayload = Joi.object().required()
