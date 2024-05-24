import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { concessionProofSchema } from './concession-proof.schema.js'
import { permitSchema } from './permit.schema.js'
import { contactResponseSchema } from './contact.schema.js'
import { finalisedPermissionSchemaContent } from './permission.schema.js'

export const permissionRenewalDataRequestParamsSchema = Joi.object({
  referenceNumber: validation.permission.createPermissionNumberValidator(Joi)
}).label('permission-renewal-data-request-params')

export const permissionRenewalDataResponseSchema = Joi.object({
  permission: {
    ...finalisedPermissionSchemaContent,
    licensee: contactResponseSchema,
    concessions: concessionProofSchema,
    permit: permitSchema
  }
}).label('permission-renewal-data-response')
