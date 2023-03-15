import Joi from 'joi'
import { buildJoiOptionSetValidator, createEntityIdValidator } from './validators/validators.js'
import { Contact } from '@defra-fish/dynamics-lib'
import { validation, POCL_TRANSACTION_SOURCES } from '@defra-fish/business-rules-lib'
import { optionSetOption } from './option-set.schema.js'
const DATASOURCE_REF = '/dataSource'
const UK_COUNTRIES = ['GB', 'GB-ENG', 'GB-WLS', 'GB-SCT', 'GB-NIR']

export const commonContactSchema = {
  id: Joi.string()
    .guid()
    .optional()
    .external(createEntityIdValidator(Contact))
    .description('the contact identifier of an existing contact record to be updated')
    .example('1329a866-d175-ea11-a811-000d3a64905b'),
  firstName: validation.contact.createFirstNameValidator(Joi, { minimumLength: 1 }),
  lastName: validation.contact.createLastNameValidator(Joi, { minimumLength: 1 }),
  birthDate: validation.contact.createBirthDateValidator(Joi),
  email: validation.contact.createEmailValidator(Joi).allow(null),
  mobilePhone: validation.contact.createMobilePhoneValidator(Joi).allow(null),
  organisation: Joi.string()
    .trim()
    .min(1)
    .optional()
    .allow(null)
    .example('Example Organisation'),
  premises: Joi.when(Joi.ref(DATASOURCE_REF), {
    is: Joi.string().valid(...POCL_TRANSACTION_SOURCES),
    then: validation.contact
      .createPremisesValidator(Joi)
      .optional()
      .allow(null, ''),
    otherwise: validation.contact.createPremisesValidator(Joi)
  }).example('Example House'),
  street: validation.contact.createStreetValidator(Joi).allow(null),
  locality: validation.contact.createLocalityValidator(Joi).allow(null),
  town: Joi.when(Joi.ref(DATASOURCE_REF), {
    is: Joi.string().valid(...POCL_TRANSACTION_SOURCES),
    then: validation.contact
      .createTownValidator(Joi)
      .optional()
      .allow(null, ''),
    otherwise: validation.contact.createTownValidator(Joi)
  }).example('Exampleton'),
  postcode: Joi.when(Joi.ref(DATASOURCE_REF), {
    is: Joi.string().valid(...POCL_TRANSACTION_SOURCES),
    then: Joi.alternatives().conditional('country', {
      is: Joi.string().valid(...UK_COUNTRIES),
      then: validation.contact
        .createUKPostcodeValidator(Joi)
        .optional()
        .allow(null, ''),
      otherwise: validation.contact
        .createOverseasPostcodeValidator(Joi)
        .optional()
        .allow(null, '')
    }),
    otherwise: Joi.alternatives().conditional('country', {
      is: Joi.string().valid('GB', 'United Kingdom'),
      then: validation.contact.createUKPostcodeValidator(Joi),
      otherwise: validation.contact.createOverseasPostcodeValidator(Joi)
    })
  }).example('AB12 3CD'),
  postalFulfilment: Joi.boolean()
    .optional()
    .allow(null)
    .example('true'),
  obfuscatedDob: Joi.string()
    .optional()
    .max(14)
    .example('12123456781234')
}

export const contactRequestSchema = Joi.object({
  ...commonContactSchema,
  country: buildJoiOptionSetValidator('defra_country', 'GB'),
  preferredMethodOfConfirmation: buildJoiOptionSetValidator('defra_preferredcontactmethod', 'Text'),
  preferredMethodOfNewsletter: buildJoiOptionSetValidator('defra_preferredcontactmethod', 'Email'),
  preferredMethodOfReminder: buildJoiOptionSetValidator('defra_preferredcontactmethod', 'Letter'),
  shortTermPreferredMethodOfConfirmation: buildJoiOptionSetValidator('defra_shorttermlicencemethodofconfirmation', 'Text')
})
  .required()
  .description('Details of the associated contact')
  .label('contact')

export const contactResponseSchema = Joi.object({
  ...commonContactSchema,
  country: optionSetOption,
  preferredMethodOfConfirmation: optionSetOption,
  preferredMethodOfNewsletter: optionSetOption,
  preferredMethodOfReminder: optionSetOption,
  shortTermPreferredMethodOfConfirmation: optionSetOption
})
  .required()
  .label('contact-response')
