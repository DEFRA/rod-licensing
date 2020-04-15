import Joi from '@hapi/joi'
import { contactSchema } from './contact.schema.js'
import { concessionProofSchema } from './concession-proof.schema.js'
import { createReferenceDataEntityValidator, createAlternateKeyValidator } from './validators/index.js'
import { Permit, Permission } from '@defra-fish/dynamics-lib'
import { validation } from '@defra-fish/business-rules-lib'

export const createPermissionSchema = Joi.object({
  permitId: Joi.string()
    .guid()
    .external(createReferenceDataEntityValidator(Permit))
    .required()
    .description('The ID of the permit associated with this permission')
    .example('cb1b34a0-0c66-e611-80dc-c4346bad0190'),
  licensee: contactSchema.required().description('The contact associated with the permission'),
  concession: concessionProofSchema.optional(),
  issueDate: Joi.string()
    .isoDate()
    .required()
    .description('An ISO8601 compatible date string defining when the permission was issued')
    .example(new Date().toISOString()),
  startDate: Joi.string()
    .isoDate()
    .required()
    .description('An ISO8601 compatible date string defining when the permission commences')
    .example(new Date().toISOString())
}).label('create-permission-request')

export const createPermissionResponseSchema = createPermissionSchema
  .append({
    referenceNumber: validation.permission.permissionNumberValidator.external(
      createAlternateKeyValidator(Permission, Permission.definition.mappings.referenceNumber.field, true)
    ),
    endDate: Joi.string()
      .isoDate()
      .required()
      .description('An ISO8601 compatible date string defining when the permission expires')
      .example(new Date().toISOString())
  })
  .label('create-permission-response')
