import { BUY_OR_RENEW } from '../../uri.js'
import Joi from 'joi'
import pageRoute from '../../routes/page-route.js'
import { nextPage } from '../../routes/next-page.js'
export const buyOrRenew = {
  buy: 'buy',
  renew: 'renew'
}

export const validator = Joi.object({
  'buy-or-renew': Joi.string()
    .valid('buy-licence', 'renew-licence')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

const route = pageRoute(BUY_OR_RENEW.page, BUY_OR_RENEW.uri, validator, nextPage)

export default route
