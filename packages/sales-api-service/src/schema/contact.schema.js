import Joi from '@hapi/joi'
import { createOptionSetValidator, createEntityIdValidator } from './validators/index.js'
import { Contact } from '@defra-fish/dynamics-lib'
import { validation } from '@defra-fish/business-rules-lib'

const preferredContactMethodValidator = Joi.string()
  .trim()
  .external(createOptionSetValidator('defra_preferredcontactmethod'))
  .required()
  .description('See defra_preferredcontactmethod for available options')

export const contactSchema = Joi.object({
  contactId: Joi.string()
    .guid()
    .external(createEntityIdValidator(Contact))
    .optional()
    .description('the contact identifier of an existing contact record to be updated')
    .example('1329a866-d175-ea11-a811-000d3a64905b'),
  firstName: Joi.string()
    .trim()
    .min(2)
    .required()
    .example('Fester'),
  lastName: Joi.string()
    .trim()
    .min(2)
    .required()
    .example('Tester'),
  birthDate: validation.contact.birthDateValidator,
  email: validation.contact.emailValidator,
  mobilePhone: validation.contact.mobilePhoneValidator,
  premises: Joi.string()
    .trim()
    .min(1)
    .required()
    .example('Example House'),
  street: Joi.string()
    .trim()
    .min(1)
    .example('Example Street'),
  locality: Joi.string()
    .trim()
    .min(1)
    .example('Near Sample'),
  town: Joi.string()
    .trim()
    .min(1)
    .required()
    .example('Exampleton'),
  postcode: Joi.alternatives().conditional('country', {
    is: 'United Kingdom',
    then: validation.contact.ukPostcodeValidator,
    otherwise: Joi.string()
      .trim()
      .required()
  }),
  country: Joi.string()
    .trim()
    .external(createOptionSetValidator('defra_country'))
    .required()
    .description('See defra_country for available options')
    .example('United Kingdom'),
  preferredMethodOfConfirmation: preferredContactMethodValidator.example('Text'),
  preferredMethodOfNewsletter: preferredContactMethodValidator.example('Email'),
  preferredMethodOfReminder: preferredContactMethodValidator.example('Letter')
}).label('contact')
