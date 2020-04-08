import { CONTACT, NEWSLETTER, CONTROLLER } from '../../../constants.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // We need to have set contact method
  if (!permission.contact || !permission.contact.method) {
    throw new GetDataRedirect(CONTACT.uri)
  }

  return { emailAddress: permission.contact.emailAddress, method: permission.contact.method }
}

const validator = Joi.object({
  newsletter: Joi.string()
    .valid('yes', 'no')
    .required(),
  email: Joi.alternatives().conditional('newsletter', {
    is: 'yes',
    then: Joi.string()
      .trim()
      .email({ minDomainSegments: 2 })
      .max(50)
      .required(),
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(NEWSLETTER.page, NEWSLETTER.uri, validator, CONTROLLER.uri, getData)
