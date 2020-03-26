import { NUMBER_OF_RODS, CONTROLLER } from '../../constants.js'
import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'number-of-rods': Joi.string()
    .valid('2', '3')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(NUMBER_OF_RODS.page, NUMBER_OF_RODS.uri, validator, CONTROLLER.uri)
