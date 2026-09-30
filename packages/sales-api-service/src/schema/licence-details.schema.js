import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { permitSchema } from './permit.schema.js'
import { contactResponseSchema } from './contact.schema.js'
import { finalisedPermissionSchemaContent } from './permission.schema.js'

export const licenceDetailsRequestQuerySchema = Joi.object({
  licenseeFirstName: validation.contact.createFirstNameValidator(Joi).description('The first name of the licensee'),
  licenseeLastName: validation.contact.createLastNameValidator(Joi).description('The last name of the licensee'),
  licenseeBirthDate: validation.contact.createBirthDateValidator(Joi).description('The date of birth of the licensee'),
  licenseePostcode: Joi.alternatives()
    .try(
      validation.contact.createUKPostcodeValidator(Joi).description('The postcode of the licensee'),
      validation.contact.createOverseasPostcodeValidator(Joi)
    )
    .required()
}).label('licence-details-request-query')

export const licenceDetailsResponseSchema = Joi.object({
  licences: Joi.array()
    .items(
      Joi.object({
        ...finalisedPermissionSchemaContent,
        licensee: contactResponseSchema,
        permit: permitSchema
      })
    )
    .required()
}).label('licence-details-response')
