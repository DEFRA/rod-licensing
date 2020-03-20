import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'number-of-rods': Joi.string().valid('2', '3').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute('number-of-rods', '/buy/number-of-rods', validator, '/controller')
