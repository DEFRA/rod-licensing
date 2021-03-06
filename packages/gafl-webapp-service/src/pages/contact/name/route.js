import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { NAME } from '../../../uri.js'
import { validation } from '@defra-fish/business-rules-lib'
import { nextPage } from '../../../routes/next-page.js'

const validator = Joi.object({
  'first-name': validation.contact.createFirstNameValidator(Joi),
  'last-name': validation.contact.createLastNameValidator(Joi)
}).options({ abortEarly: false, allowUnknown: true })

const namePageRoute = pageRoute(NAME.page, NAME.uri, validator, nextPage)

// Sanitize does not play well with the name validator and is unnecessary
Object.assign(namePageRoute[1].options, {
  plugins: {
    disinfect: {
      disinfectQuery: true,
      disinfectParams: false,
      disinfectPayload: false
    }
  }
})

export { namePageRoute as default }
