import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'licence-type': Joi.string().valid('trout-and-course', 'salmon-and-sea-trout').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute('licence-type', '/buy/licence-type', validator, '/buy')
