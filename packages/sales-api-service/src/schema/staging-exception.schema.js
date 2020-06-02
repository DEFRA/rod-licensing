import Joi from '@hapi/joi'
import { buildJoiOptionSetValidator, createAlternateKeyValidator } from './validators/validators.js'
import { PoclFile, PoclStagingException } from '@defra-fish/dynamics-lib'

/**
 * Schema for the create staging exception request
 * @type {Joi.AnySchema}
 */
export const createStagingExceptionRequestSchema = Joi.object({
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
    transactionFile: Joi.string().required(),
    permissionId: Joi.string()
  })
})
  .or('stagingException', 'transactionFileException')
  .label('create-staging-exception-request')

/**
 * Schema for the create staging exception response
 * @type {Joi.AnySchema}
 */
export const createStagingExceptionResponseSchema = Joi.object({
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
  })
}).label('create-staging-exception-response')
