import { LICENCE_TYPE, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'

export const licenseTypes = {
  troutAndCoarse2Rod: 'trout-and-coarse-2-rod',
  troutAndCoarse3Rod: 'trout-and-coarse-3-rod',
  salmonAndSeaTrout: 'salmon-and-sea-trout'
}

const validator = Joi.object({
  'licence-type': Joi.string()
    .valid(...Object.values(licenseTypes))
    .required()
}).options({ abortEarly: false, allowUnknown: true })

const getData = async request => ({
  licenseTypes,
  permission: await request.cache().helpers.transaction.getCurrentPermission()
})

export default pageRoute(LICENCE_TYPE.page, LICENCE_TYPE.uri, validator, CONTROLLER.uri, getData)
