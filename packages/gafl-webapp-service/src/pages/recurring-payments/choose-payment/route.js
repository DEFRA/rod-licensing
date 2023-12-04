import { CHOOSE_PAYMENT } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { nextPage } from '../../../routes/next-page.js'

export const validator = Joi.object({
  'recurring-payment': Joi.string().valid('yes', 'no').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(CHOOSE_PAYMENT.page, CHOOSE_PAYMENT.uri, validator, nextPage)
