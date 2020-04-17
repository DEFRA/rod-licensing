import { CONTACT, CONTROLLER, LICENCE_LENGTH, DATE_OF_BIRTH, LICENCE_TO_START } from '../../../constants.js'

import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import Joi from '@hapi/joi'
import { validation } from '@defra-fish/business-rules-lib'
import * as concessionHelper from '../../../processors/concession-helper.js'

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // We need to have set the licence length, dob and start date here to determining the contact
  // messaging
  if (!permission.licenceLength) {
    throw new GetDataRedirect(LICENCE_LENGTH.uri)
  }

  if (!permission.licenceStartDate) {
    throw new GetDataRedirect(LICENCE_TO_START.uri)
  }

  if (!permission.licensee.birthDate) {
    throw new GetDataRedirect(DATE_OF_BIRTH.uri)
  }

  return {
    licenceLength: permission.licenceLength,
    junior: concessionHelper.hasJunior(permission.licensee)
  }
}

const validator = Joi.object({
  'how-contacted': Joi.string()
    .valid('email', 'text', 'none')
    .required(),
  email: Joi.alternatives().conditional('how-contacted', {
    is: 'email',
    then: validation.contact.emailValidator,
    otherwise: Joi.string().empty('')
  }),
  text: Joi.alternatives().conditional('how-contacted', {
    is: 'text',
    then: validation.contact.mobilePhoneValidator,
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(CONTACT.page, CONTACT.uri, validator, CONTROLLER.uri, getData)
