import Joi from '@hapi/joi'
import { createOptionSetValidator, createEntityIdValidator } from './validators/index.js'
import { Contact } from '@defra-fish/dynamics-lib'
import { validation } from '@defra-fish/business-rules-lib'

export const contactSchema = Joi.object({
  contactId: Joi.string()
    .guid()
    .external(createEntityIdValidator(Contact))
    .optional()
    .description('the contact identifier of an existing contact record to be updated')
    .example('1329a866-d175-ea11-a811-000d3a64905b'),
  firstName: validation.contact.firstNameValidator,
  lastName: validation.contact.lastNameValidator,
  birthDate: validation.contact.birthDateValidator,
  email: validation.contact.emailValidator,
  mobilePhone: validation.contact.mobilePhoneValidator,
  premises: validation.contact.premisesValidator,
  street: validation.contact.streetValidator,
  locality: validation.contact.localityValidator,
  town: validation.contact.townValidator,
  postcode: Joi.alternatives().conditional('country', {
    is: Joi.string().valid('GB', 'United Kingdom'),
    then: validation.contact.ukPostcodeValidator,
    otherwise: Joi.string()
      .trim()
      .required()
  }),
  country: createOptionSetValidator('defra_country', 'GB'),
  preferredMethodOfConfirmation: createOptionSetValidator('defra_preferredcontactmethod', 'Text'),
  preferredMethodOfNewsletter: createOptionSetValidator('defra_preferredcontactmethod', 'Email'),
  preferredMethodOfReminder: createOptionSetValidator('defra_preferredcontactmethod', 'Letter')
}).label('contact')
