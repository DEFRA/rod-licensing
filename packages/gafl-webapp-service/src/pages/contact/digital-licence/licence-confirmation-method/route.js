import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'

import { LICENCE_CONFIRMATION_METHOD, DATE_OF_BIRTH, LICENCE_TO_START, LICENCE_LENGTH } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { nextPage } from '../../../../routes/next-page.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // We need to have set the licence length, dob and start date here to determining the contact
  // messaging
  if (!permission.licensee.birthDate) {
    throw new GetDataRedirect(DATE_OF_BIRTH.uri)
  }

  if (!permission.licenceStartDate) {
    throw new GetDataRedirect(LICENCE_TO_START.uri)
  }

  if (!permission.licenceLength) {
    throw new GetDataRedirect(LICENCE_LENGTH.uri)
  }

  return {
    licensee: permission.licensee,
    howContacted: HOW_CONTACTED
  }
}

export const mobilePhoneRegex = /^((\+44)(\s?)|(0))(7\d{3})(\s?)(\d{3})(\s?)(\d{3})$/
export const mobilePhoneValidator = Joi.string()
  .trim()
  .pattern(mobilePhoneRegex)
  .replace(mobilePhoneRegex, '$2$4$5$7$9')
  .example('+44 7700 900088')

const validator = Joi.object({
  'licence-confirmation-method': Joi.string()
    .valid('email', 'text')
    .required(),
  email: Joi.alternatives().conditional('licence-confirmation-method', {
    is: 'email',
    then: validation.contact.createEmailValidator(Joi),
    otherwise: Joi.string().empty('')
  }),
  text: Joi.alternatives().conditional('licence-confirmation-method', {
    is: 'text',
    then: mobilePhoneValidator,
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(LICENCE_CONFIRMATION_METHOD.page, LICENCE_CONFIRMATION_METHOD.uri, validator, nextPage, getData)
