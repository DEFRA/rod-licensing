import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'licence-to-start': Joi.string()
    .valid('after-payment', 'another-date-or-time')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute('licence-to-start', '/buy/start-kind', validator, '/buy')
