import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'licence-length': Joi.string().valid('12M', '8D', '1D').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute('licence-length', '/buy/licence-length', validator, '/buy')
