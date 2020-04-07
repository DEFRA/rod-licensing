import { NEWSLETTER, CONTROLLER } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  return {}
}

const validator = Joi.object({}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(NEWSLETTER.page, NEWSLETTER.uri, validator, CONTROLLER.uri, getData)
