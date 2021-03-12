import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'

import { CONTACT, LICENCE_CONFIRMATION_METHOD } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { nextPage } from '../../../../routes/next-page.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'
import { mobilePhoneValidator } from '../../../../processors/contact-validator.js'

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // page is only permitted for physical licences
  if (!isPhysical(permission)) {
    throw new GetDataRedirect(CONTACT.uri)
  }

  const { licensee } = permission
  return {
    licensee: permission.licensee,
    howContacted: HOW_CONTACTED,
    postalFulfilment: licensee.postalFulfilment
  }
}

const validator = Joi.object({
  'licence-confirmation-method': Joi.string()
    .valid('email', 'text', 'none')
    .required(),
  text: Joi.alternatives().conditional('licence-confirmation-method', {
    is: 'text',
    then: mobilePhoneValidator,
    otherwise: Joi.string().empty('')
  }),
  email: Joi.alternatives().conditional('licence-confirmation-method', {
    is: 'email',
    then: validation.contact.createEmailValidator(Joi),
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(LICENCE_CONFIRMATION_METHOD.page, LICENCE_CONFIRMATION_METHOD.uri, validator, nextPage, getData)
