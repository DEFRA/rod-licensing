import { START_PAGE } from '../../uri.js'
import Joi from 'joi'
import pageRoute from '../../routes/page-route.js'
import { nextPage } from '../../routes/next-page.js'
export const buyOrRenew = {
  buy: 'buy',
  renew: 'renew'
}

export const validator = Joi.object({
  'start-page': Joi.string()
    .valid('buy-licence', 'renew-licence')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

const route = pageRoute(START_PAGE.page, START_PAGE.uri, validator, nextPage)

export default route
