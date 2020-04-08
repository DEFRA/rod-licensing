import { NEWSLETTER, CONTROLLER } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  if (permission.contact && permission.contact.emailAddress) {
    return { emailAddress: permission.contact.emailAddress }
  } else {
    return { emailAddress: null }
  }
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
