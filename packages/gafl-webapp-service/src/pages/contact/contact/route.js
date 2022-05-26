import { CONTACT, LICENCE_LENGTH, DATE_OF_BIRTH, LICENCE_TO_START } from '../../../uri.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { hasJunior } from '../../../processors/concession-helper.js'
import { nextPage } from '../../../routes/next-page.js'
import { mobilePhoneValidator } from '../../../processors/contact-validator.js'

export const getData = async request => {
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
    isLicenceForYou: permission.isLicenceForYou,
    licensee: permission.licensee,
    isPhysical: isPhysical(permission),
    isJunior: hasJunior(permission),
    howContacted: HOW_CONTACTED
  }
}

export const validator = Joi.object({
  'how-contacted': Joi.string().valid('email', 'text', 'none').required(),
  email: Joi.alternatives().conditional('how-contacted', {
    is: 'email',
    then: validation.contact.createEmailValidator(Joi),
    otherwise: Joi.string().empty('')
  }),
  text: Joi.alternatives().conditional('how-contacted', {
    is: 'text',
    then: mobilePhoneValidator,
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(CONTACT.page, CONTACT.uri, validator, nextPage, getData)
