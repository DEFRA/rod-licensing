import Joi from 'joi'
import { contactRequestSchema } from './contact.schema.js'
import { concessionProofSchema } from './concession-proof.schema.js'
import { optionSetOption } from './option-set.schema.js'
import { createReferenceDataEntityValidator } from './validators/validators.js'
import { Permit } from '@defra-fish/dynamics-lib'
import { validation } from '@defra-fish/business-rules-lib'

const DATE_EXAMPLE = '2025-01-01T00:00:00.000Z'
const issueDateSchema = Joi.string()
  .isoDate()
  .required()
  .allow(null)
  .description('An ISO8601 compatible date string defining when the permission was issued')
  .example(DATE_EXAMPLE)
const startDateSchema = Joi.string()
  .isoDate()
  .required()
  .allow(null)
  .description('An ISO8601 compatible date string defining when the permission commences')
  .example(DATE_EXAMPLE)
const endDateSchema = Joi.string()
  .isoDate()
  .required()
  .description('An ISO8601 compatible date string defining when the permission expires')
  .example(DATE_EXAMPLE)

export const stagedPermissionSchema = Joi.object({
  permitId: Joi.string()
    .guid()
    .external(createReferenceDataEntityValidator(Permit))
    .required()
    .description('The ID of the permit associated with this permission')
    .example('cb1b34a0-0c66-e611-80dc-c4346bad0190'),
  licensee: contactRequestSchema,
  concessions: concessionProofSchema.optional(),
  issueDate: issueDateSchema.allow(null),
  startDate: startDateSchema.allow(null),
  isRenewal: Joi.boolean(),
  isLicenceForYou: Joi.boolean().optional().allow(null).example('true')
}).label('staged-permission')

export const finalisedPermissionSchemaContent = {
  id: Joi.string().guid().required().example('a17fc331-141b-4fc0-8549-329d6934fadb'),
  referenceNumber: validation.permission.createPermissionNumberValidator(Joi),
  issueDate: issueDateSchema,
  startDate: startDateSchema,
  endDate: endDateSchema,
  stagingId: Joi.string().guid().required().example('a17fc331-141b-4fc0-8549-329d6934fadb'),
  dataSource: optionSetOption
}

export const finalisePermissionResponseSchema = stagedPermissionSchema
  .append({
    referenceNumber: validation.permission.createPermissionNumberValidator(Joi),
    endDate: endDateSchema
  })
  .label('finalised-permission')
