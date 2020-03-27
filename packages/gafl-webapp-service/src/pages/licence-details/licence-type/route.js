import { LICENCE_TYPE, CONTROLLER } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const validator = Joi.object({
  'licence-type': Joi.string()
    .valid('trout-and-coarse', 'salmon-and-sea-trout')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(LICENCE_TYPE.page, LICENCE_TYPE.uri, validator, CONTROLLER.uri)
