import { LICENCE_LENGTH, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { pricingDetail } from '../../../processors/pricing-summary.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'

const validator = Joi.object({
  'licence-length': Joi.string()
    .valid('12M', '8D', '1D')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const pricing = await pricingDetail(LICENCE_LENGTH.page, permission)
  return { pricing, licenceTypeStr: licenceTypeDisplay(permission) }
}

export default pageRoute(LICENCE_LENGTH.page, LICENCE_LENGTH.uri, validator, CONTROLLER.uri, getData)
