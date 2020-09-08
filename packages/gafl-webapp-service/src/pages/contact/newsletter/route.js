import { NEWSLETTER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { nextPage } from '../../../routes/next-page.js'

const getData = async request => {
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  return {
    emailEntry: licensee.preferredMethodOfConfirmation !== HOW_CONTACTED.email
  }
}

const validator = Joi.object({
  newsletter: Joi.string()
    .valid('yes', 'no')
    .required(),
  'email-entry': Joi.string()
    .valid('yes', 'no')
    .required(),
  email: Joi.alternatives().conditional('newsletter', {
    is: 'yes',
    then: Joi.alternatives().conditional('email-entry', {
      is: 'yes',
      then: Joi.string()
        .trim()
        .email({ minDomainSegments: 2 })
        .max(50)
        .required(),
      otherwise: Joi.string().empty('')
    }),
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(NEWSLETTER.page, NEWSLETTER.uri, validator, nextPage, getData)
