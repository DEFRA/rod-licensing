import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { concessionProofSchema } from './concession-proof.schema.js'
import { permitSchema } from './permit.schema.js'
import { contactResponseSchema } from './contact.schema.js'
import { finalisedPermissionSchemaContent } from './permission.schema.js'

const REFERENCE_LENGTH = 6

export const authenticateRenewalRequestParamsSchema = Joi.object({
  referenceNumber: Joi.string().min(REFERENCE_LENGTH).required().description('The permission reference number (supports partial)')
}).label('authenticate-renewal-request-params')

export const authenticateRenewalRequestQuerySchema = Joi.object({
  licenseeBirthDate: validation.contact.createBirthDateValidator(Joi).description('The date of birth of the licensee'),
  licenseePostcode: Joi.alternatives().try(
    validation.contact.createUKPostcodeValidator(Joi).description('The postcode of the licensee'),
    validation.contact.createOverseasPostcodeValidator(Joi)
  )
}).label('authenticate-renewal-request-query')

export const authenticateRenewalResponseSchema = Joi.object({
  permission: {
    ...finalisedPermissionSchemaContent,
    licensee: contactResponseSchema,
    concessions: concessionProofSchema,
    permit: permitSchema
  }
}).label('authenticate-renewal-response')

export const rcpAuthenticateRenewalResponseSchema = Joi.object({
  permission: {
    ...finalisedPermissionSchemaContent,
    licensee: contactResponseSchema,
    concessions: concessionProofSchema,
    permit: permitSchema
  },
  recurringPayment: Joi.object({
    id: Joi.string().uuid().required(),
    agreementId: Joi.string().required(),
    status: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
    nextDueDate: Joi.date().required(),
    cancelledDate: Joi.date().allow(null),
    cancelledReason: Joi.string().allow(null),
    endDate: Joi.date().required(),
    lastDigitsCardNumbers: Joi.string().required()
  }).optional()
}).label('rcp-authenticate-renewal-response')
