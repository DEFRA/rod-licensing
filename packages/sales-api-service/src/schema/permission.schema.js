import Joi from '@hapi/joi'
import { contactRequestSchema } from './contact.schema.js'
import { concessionProofSchema } from './concession-proof.schema.js'
import { optionSetOption } from './option-set.schema.js'
import { createReferenceDataEntityValidator, createPermitConcessionValidator } from './validators/validators.js'
import { Permit } from '@defra-fish/dynamics-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { v4 as uuid } from 'uuid'

const issueDateSchema = Joi.string()
  .isoDate()
  .required()
  .description('An ISO8601 compatible date string defining when the permission was issued')
  .example(new Date().toISOString())
const startDateSchema = Joi.string()
  .isoDate()
  .required()
  .description('An ISO8601 compatible date string defining when the permission commences')
  .example(new Date().toISOString())
const endDateSchema = Joi.string()
  .isoDate()
  .required()
  .description('An ISO8601 compatible date string defining when the permission expires')
  .example(new Date().toISOString())

export const createPermissionSchema = Joi.object({
  permitId: Joi.string()
    .guid()
    .external(createReferenceDataEntityValidator(Permit))
    .required()
    .description('The ID of the permit associated with this permission')
    .example('cb1b34a0-0c66-e611-80dc-c4346bad0190'),
  licensee: contactRequestSchema,
  concessions: concessionProofSchema.optional(),
  issueDate: issueDateSchema,
  startDate: startDateSchema
})
  .external(createPermitConcessionValidator())
  .label('create-transaction-request-permission')

export const createPermissionResponseSchema = createPermissionSchema
  .append({
    referenceNumber: validation.permission.createPermissionNumberValidator(Joi),
    endDate: endDateSchema
  })
  .label('create-transaction-response-permission')

export const permissionFieldsSchemaDefinitions = {
  id: Joi.string()
    .guid()
    .required()
    .example(uuid()),
  referenceNumber: validation.permission.createPermissionNumberValidator(Joi),
  issueDate: issueDateSchema,
  startDate: startDateSchema,
  endDate: endDateSchema,
  stagingId: Joi.string()
    .guid()
    .required()
    .example(uuid()),
  dataSource: optionSetOption
}

export const permissionSchema = Joi.object(permissionFieldsSchemaDefinitions).label('permission')
